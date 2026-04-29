import { createReadStream } from 'fs';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { ApiKeyEntity } from '@/database/entities/embed/api-key.entity';
import { EmbedProjectEntity } from '@/database/entities/embed/embed-project.entity';
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
import { FilesService } from '@/modules/files/files.service';
import { Model3dService } from '@/modules/models-3d/services/model-3d.service';
import { OrgMemberRepository } from '@/modules/organizations/repositories/org-member.repository';
import { ScenesService } from '@/modules/scenes/services/scenes.service';

@Injectable()
export class EmbedService {
  public constructor(
    private readonly embedProjectRepository: EmbedProjectRepository,
    private readonly domainWhitelistRepository: EmbedDomainWhitelistRepository,
    private readonly viewLogRepository: ModelViewLogRepository,
    private readonly model3dService: Model3dService,
    private readonly orgMemberRepository: OrgMemberRepository,
    private readonly filesService: FilesService,
    private readonly scenesService: ScenesService,
  ) {}

  public async getEmbedViewer(
    targetId: string,
    apiKey: ApiKeyEntity,
    origin: string | undefined,
  ): Promise<EmbedViewerResponseDto> {
    const project = await this.embedProjectRepository.findByModelOrScene(targetId);
    if (!project) {
      throw new NotFoundException('Embed project not found for this target');
    }

    if (project.orgId !== apiKey.orgId) {
      throw new ForbiddenException('API key does not belong to this project organisation');
    }

    this.assertOriginAllowed(project, origin);

    if (project.modelId && project.modelId === targetId) {
      const model = await this.model3dService.get3DModel(project.modelId);
      this.viewLogRepository.createLog(project.id, project.modelId, origin);
      return EmbedMapper.toViewerModelResponse(model, project);
    }

    if (project.sceneId && project.sceneId === targetId) {
      // Scene visibility is bypassed: API key + domain whitelist are the auth surface for embeds.
      const scene = await this.scenesService.getSceneForEmbed(project.sceneId);
      // No view log row yet — model_view_log requires model_id; scene analytics tracked in a later iter.
      return EmbedMapper.toViewerSceneResponse(scene, project);
    }

    throw new NotFoundException('Embed project target mismatch');
  }

  public async createProject(user: UserEntity, dto: EmbedProjectCreateRequestDto): Promise<EmbedProjectResponseDto> {
    await this.requireMembership(dto.orgId, user.id, OrgMemberRole.Editor);

    const hasModel = !!dto.modelId;
    const hasScene = !!dto.sceneId;
    if (hasModel === hasScene) {
      throw new BadRequestException('Embed project must reference exactly one of modelId or sceneId');
    }

    if (hasScene) {
      await this.scenesService.assertCanReadScene(dto.sceneId!, user.id);
    }

    const project = this.embedProjectRepository.create({
      orgId: dto.orgId,
      name: dto.name,
      modelId: dto.modelId ?? null,
      sceneId: dto.sceneId ?? null,
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
    if ('sceneId' in dto) {
      project.sceneId = dto.sceneId ?? null;
      if (project.sceneId) {
        await this.scenesService.assertCanReadScene(project.sceneId, user.id);
      }
    }
    if (dto.brandingConfig !== undefined) project.brandingConfig = dto.brandingConfig ?? null;

    const hasModel = !!project.modelId;
    const hasScene = !!project.sceneId;
    if (hasModel === hasScene) {
      throw new BadRequestException('Embed project must reference exactly one of modelId or sceneId');
    }

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

  public async uploadProjectLogo(
    projectId: string,
    user: UserEntity,
    file: Express.Multer.File,
  ): Promise<EmbedProjectResponseDto> {
    const project = await this.embedProjectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException('Embed project not found');
    }

    await this.requireMembership(project.orgId, user.id, OrgMemberRole.Editor);

    await this.filesService.saveEmbedLogo(projectId, file);

    const logoUrl = `/api/embed/projects/${projectId}/logo`;
    project.brandingConfig = { ...(project.brandingConfig ?? { showBadge: true }), logoUrl };
    await this.embedProjectRepository.save(project);

    const updated = await this.embedProjectRepository.findById(projectId);
    return EmbedMapper.toProjectResponse(updated!);
  }

  public async streamProjectLogo(projectId: string, res: Response): Promise<StreamableFile> {
    const logoDir = join(process.cwd(), 'files', 'embed', projectId);
    let files: string[];
    try {
      files = await readdir(logoDir);
    } catch {
      throw new NotFoundException('Logo not found');
    }
    const logoFile = files.find((f) => f.startsWith('logo'));
    if (!logoFile) {
      throw new NotFoundException('Logo not found');
    }
    res.set({ 'Content-Disposition': `inline; filename="${logoFile}"` });
    return new StreamableFile(createReadStream(join(logoDir, logoFile)));
  }

  private assertOriginAllowed(project: EmbedProjectEntity, origin: string | undefined): void {
    if (origin === undefined) return;

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
