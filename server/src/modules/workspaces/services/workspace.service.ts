import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { OrgMemberRole, OrgMemberRoleWeights } from '@/database/entities/organizations/org-member.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { WorkspaceMemberEntity, WorkspaceMemberRole } from '@/database/entities/workspaces/workspace-member.entity';
import { WorkspaceEntity } from '@/database/entities/workspaces/workspace.entity';
import { OrgMemberRepository } from '@/modules/organizations/repositories/org-member.repository';
import { WorkspaceMemberAddRequestDto } from '@/modules/workspaces/dto/workspace-member.add.request.dto';
import { WorkspaceCreateRequestDto } from '@/modules/workspaces/dto/workspace.create.request.dto';
import { WorkspaceResponseDto } from '@/modules/workspaces/dto/workspace.response.dto';
import { WorkspaceUpdateRequestDto } from '@/modules/workspaces/dto/workspace.update.request.dto';
import { WorkspaceMapper } from '@/modules/workspaces/mappers/workspace.mapper';
import { WorkspaceMemberRepository } from '@/modules/workspaces/repositories/workspace-member.repository';
import { WorkspaceRepository } from '@/modules/workspaces/repositories/workspace.repository';

@Injectable()
export class WorkspaceService {
  public constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
    private readonly orgMemberRepository: OrgMemberRepository,
  ) {}

  public async createWorkspace(user: UserEntity, dto: WorkspaceCreateRequestDto): Promise<WorkspaceResponseDto> {
    const orgMember = await this.orgMemberRepository.findByOrgAndUser(dto.orgId, user.id);
    if (!orgMember || OrgMemberRoleWeights[orgMember.role] < OrgMemberRoleWeights[OrgMemberRole.Admin]) {
      throw new ForbiddenException('You must be an org admin to create workspaces');
    }

    const workspace = await this.workspaceRepository.manager.transaction(async (em) => {
      const ws = em.create(WorkspaceEntity, { name: dto.name, orgId: dto.orgId });
      const savedWs = await em.save(ws);

      const member = em.create(WorkspaceMemberEntity, {
        workspaceId: savedWs.id,
        userId: user.id,
        role: WorkspaceMemberRole.Editor,
      });
      await em.save(member);

      return savedWs;
    });

    return WorkspaceMapper.toResponse(workspace, 1);
  }

  public async getMyWorkspaces(user: UserEntity, orgId?: string): Promise<WorkspaceResponseDto[]> {
    const members = await this.workspaceMemberRepository.find({
      where: { userId: user.id },
      relations: { workspace: true },
    });

    const filtered = orgId ? members.filter((m) => m.workspace.orgId === orgId) : members;

    return Promise.all(
      filtered.map(async (m) => {
        const count = await this.workspaceMemberRepository.countByWorkspace(m.workspaceId);
        return WorkspaceMapper.toResponse(m.workspace, count);
      }),
    );
  }

  public async getWorkspace(workspaceId: string, user: UserEntity): Promise<WorkspaceResponseDto> {
    const workspace = await this.workspaceRepository.findOne({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const member = await this.workspaceMemberRepository.findByWorkspaceAndUser(workspaceId, user.id);
    if (!member) throw new ForbiddenException();

    const count = await this.workspaceMemberRepository.countByWorkspace(workspaceId);
    return WorkspaceMapper.toResponse(workspace, count);
  }

  public async updateWorkspace(
    workspaceId: string,
    user: UserEntity,
    dto: WorkspaceUpdateRequestDto,
  ): Promise<WorkspaceResponseDto> {
    const workspace = await this.workspaceRepository.findOne({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException('Workspace not found');

    await this.requireOrgAdmin(workspace.orgId, user.id);

    const updated = this.workspaceRepository.merge(workspace, dto);
    const saved = await this.workspaceRepository.save(updated);

    const count = await this.workspaceMemberRepository.countByWorkspace(workspaceId);
    return WorkspaceMapper.toResponse(saved, count);
  }

  public async deleteWorkspace(workspaceId: string, user: UserEntity): Promise<void> {
    const workspace = await this.workspaceRepository.findOne({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException('Workspace not found');

    await this.requireOrgAdmin(workspace.orgId, user.id);
    await this.workspaceRepository.softDelete({ id: workspaceId });
  }

  public async addMember(workspaceId: string, actorUser: UserEntity, dto: WorkspaceMemberAddRequestDto): Promise<void> {
    const workspace = await this.workspaceRepository.findOne({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException('Workspace not found');

    // Actor must be either org admin or a workspace editor
    const actorOrgMember = await this.orgMemberRepository.findByOrgAndUser(workspace.orgId, actorUser.id);
    const actorWsMember = await this.workspaceMemberRepository.findByWorkspaceAndUser(workspaceId, actorUser.id);
    const isOrgAdmin =
      actorOrgMember && OrgMemberRoleWeights[actorOrgMember.role] >= OrgMemberRoleWeights[OrgMemberRole.Admin];
    const isWsEditor = actorWsMember?.role === WorkspaceMemberRole.Editor;

    if (!isOrgAdmin && !isWsEditor) {
      throw new ForbiddenException('Insufficient permissions to add workspace members');
    }

    // Target user must be an org member
    const targetOrgMember = await this.orgMemberRepository.findByOrgAndUser(workspace.orgId, dto.userId);
    if (!targetOrgMember) {
      throw new UnprocessableEntityException('Target user is not a member of this organization');
    }

    // Must not already be a workspace member
    const existing = await this.workspaceMemberRepository.findByWorkspaceAndUser(workspaceId, dto.userId);
    if (existing) {
      throw new ConflictException('User is already a member of this workspace');
    }

    const member = this.workspaceMemberRepository.create({
      workspaceId,
      userId: dto.userId,
      role: dto.role,
    });
    await this.workspaceMemberRepository.save(member);
  }

  public async removeMember(workspaceId: string, actorUser: UserEntity, targetUserId: string): Promise<void> {
    const workspace = await this.workspaceRepository.findOne({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const targetMember = await this.workspaceMemberRepository.findByWorkspaceAndUser(workspaceId, targetUserId);
    if (!targetMember) throw new NotFoundException('Member not found');

    const isSelf = actorUser.id === targetUserId;
    if (!isSelf) {
      await this.requireOrgAdmin(workspace.orgId, actorUser.id);
    }

    await this.workspaceMemberRepository.softDelete({ id: targetMember.id });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async requireOrgAdmin(orgId: string, userId: string): Promise<void> {
    const orgMember = await this.orgMemberRepository.findByOrgAndUser(orgId, userId);
    if (!orgMember || OrgMemberRoleWeights[orgMember.role] < OrgMemberRoleWeights[OrgMemberRole.Admin]) {
      throw new ForbiddenException('You must be an org admin to perform this action');
    }
  }
}
