import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ApiKeyEntity } from '@/database/entities/embed/api-key.entity';
import { OrgMemberRole, OrgMemberRoleWeights } from '@/database/entities/organizations/org-member.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { DomainAddRequestDto } from '@/modules/embed/dto/domain.add.request.dto';
import { EmbedProjectCreateRequestDto } from '@/modules/embed/dto/embed-project.create.request.dto';
import { EmbedProjectResponseDto } from '@/modules/embed/dto/embed-project.response.dto';
import { EmbedProjectUpdateRequestDto } from '@/modules/embed/dto/embed-project.update.request.dto';
import { EmbedViewerResponseDto } from '@/modules/embed/dto/embed-viewer.response.dto';
import { ViewAnalyticsResponseDto } from '@/modules/embed/dto/view-analytics.response.dto';
import { EmbedMapper } from '@/modules/embed/mappers/embed.mapper';
import { EmbedDomainWhitelistRepository } from '@/modules/embed/repositories/embed-domain-whitelist.repository';
import { EmbedProjectRepository } from '@/modules/embed/repositories/embed-project.repository';
import { ModelViewLogRepository } from '@/modules/embed/repositories/model-view-log.repository';
import { Model3dService } from '@/modules/models-3d/services/model-3d.service';
import { OrgMemberRepository } from '@/modules/organizations/repositories/org-member.repository';

@Injectable()
export class EmbedService {
  public constructor(
    private readonly embedProjectRepository: EmbedProjectRepository,
    private readonly domainWhitelistRepository: EmbedDomainWhitelistRepository,
    private readonly viewLogRepository: ModelViewLogRepository,
    private readonly model3dService: Model3dService,
    private readonly orgMemberRepository: OrgMemberRepository,
  ) {}

  public async getEmbedViewer(
    modelId: string,
    apiKey: ApiKeyEntity,
    origin: string | undefined,
  ): Promise<EmbedViewerResponseDto> {
    const project = await this.embedProjectRepository.findByModel(modelId);
    if (!project) {
      throw new NotFoundException('Embed project not found for this model');
    }

    if (project.orgId !== apiKey.orgId) {
      throw new ForbiddenException('API key does not belong to this project organisation');
    }

    if (origin !== undefined) {
      let requestHostname: string;
      try {
        requestHostname = new URL(origin).hostname;
      } catch {
        throw new ForbiddenException('Invalid Origin header');
      }

      const whitelist = project.domains ?? [];
      if (whitelist.length === 0) {
        throw new ForbiddenException('Embed domain whitelist is not configured');
      }

      const allowed = whitelist.some((d) => d.domain === requestHostname);
      if (!allowed) {
        throw new ForbiddenException('Origin not in domain whitelist');
      }
    }

    const model = await this.model3dService.get3DModel(modelId);

    this.viewLogRepository.createLog(project.id, modelId, origin);

    return EmbedMapper.toViewerResponse(model, project);
  }

  public async createProject(user: UserEntity, dto: EmbedProjectCreateRequestDto): Promise<EmbedProjectResponseDto> {
    await this.requireMembership(dto.orgId, user.id, OrgMemberRole.Editor);

    const project = this.embedProjectRepository.create({
      orgId: dto.orgId,
      name: dto.name,
      modelId: dto.modelId ?? null,
      autoRotate: dto.autoRotate ?? false,
    });
    const saved = await this.embedProjectRepository.save(project);

    const withDomains = await this.embedProjectRepository.findById(saved.id);
    return EmbedMapper.toProjectResponse(withDomains!);
  }

  public async listProjects(user: UserEntity, orgId: string): Promise<EmbedProjectResponseDto[]> {
    await this.requireMembership(orgId, user.id, OrgMemberRole.Viewer);

    const projects = await this.embedProjectRepository.findByOrg(orgId);
    return projects.map(EmbedMapper.toProjectResponse);
  }

  public async updateProject(
    id: string,
    user: UserEntity,
    dto: EmbedProjectUpdateRequestDto,
  ): Promise<EmbedProjectResponseDto> {
    const project = await this.embedProjectRepository.findById(id);
    if (!project) {
      throw new NotFoundException('Embed project not found');
    }

    await this.requireMembership(project.orgId, user.id, OrgMemberRole.Editor);

    if (dto.name !== undefined) project.name = dto.name;
    if (dto.autoRotate !== undefined) project.autoRotate = dto.autoRotate;
    if ('modelId' in dto) project.modelId = dto.modelId ?? null;
    if (dto.brandingConfig !== undefined) project.brandingConfig = dto.brandingConfig ?? null;

    await this.embedProjectRepository.save(project);

    const updated = await this.embedProjectRepository.findById(id);
    return EmbedMapper.toProjectResponse(updated!);
  }

  public async addDomain(
    projectId: string,
    user: UserEntity,
    dto: DomainAddRequestDto,
  ): Promise<EmbedProjectResponseDto> {
    const project = await this.embedProjectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException('Embed project not found');
    }

    await this.requireMembership(project.orgId, user.id, OrgMemberRole.Editor);

    const entry = this.domainWhitelistRepository.create({
      embedProjectId: projectId,
      domain: dto.domain,
    });
    await this.domainWhitelistRepository.save(entry);

    const updated = await this.embedProjectRepository.findById(projectId);
    return EmbedMapper.toProjectResponse(updated!);
  }

  public async removeDomain(projectId: string, user: UserEntity, domain: string): Promise<void> {
    const project = await this.embedProjectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException('Embed project not found');
    }

    await this.requireMembership(project.orgId, user.id, OrgMemberRole.Editor);

    await this.domainWhitelistRepository.hardDeleteByProjectAndDomain(projectId, domain);
  }

  public async getAnalytics(projectId: string, user: UserEntity): Promise<ViewAnalyticsResponseDto> {
    const project = await this.embedProjectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException('Embed project not found');
    }

    await this.requireMembership(project.orgId, user.id, OrgMemberRole.Viewer);

    const [dailyViews, topOrigins, totalViews] = await Promise.all([
      this.viewLogRepository.getDailyViews(project.id),
      this.viewLogRepository.getTopOrigins(project.id),
      this.viewLogRepository.getTotalViews(project.id),
    ]);

    return EmbedMapper.toAnalyticsResponse(dailyViews, topOrigins, totalViews);
  }

  private async requireMembership(orgId: string, userId: string, minRole: OrgMemberRole): Promise<void> {
    const member = await this.orgMemberRepository.findByOrgAndUser(orgId, userId);
    if (!member) {
      throw new ForbiddenException('You are not a member of this organisation');
    }
    if (OrgMemberRoleWeights[member.role] < OrgMemberRoleWeights[minRole]) {
      throw new ForbiddenException('Insufficient role');
    }
  }
}
