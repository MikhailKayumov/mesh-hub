import { randomUUID } from 'crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OrgMemberEntity,
  OrgMemberRole,
  OrgMemberRoleWeights,
} from '@/database/entities/organizations/org-member.entity';
import { OrgSubscriptionEntity, StorageBackend } from '@/database/entities/organizations/org-subscription.entity';
import { OrganizationEntity, PlanType } from '@/database/entities/organizations/organization.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { PaginationDto, PaginationResponseDto } from '@/decorators/pagination';
import { ConfigService } from '@/modules/config/config.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { OrgInviteCreateRequestDto } from '@/modules/organizations/dto/org-invite.create.request.dto';
import { OrgMemberResponseDto } from '@/modules/organizations/dto/org-member.response.dto';
import { OrganizationCreateRequestDto } from '@/modules/organizations/dto/organization.create.request.dto';
import { OrganizationResponseDto } from '@/modules/organizations/dto/organization.response.dto';
import { OrganizationUpdateRequestDto } from '@/modules/organizations/dto/organization.update.request.dto';
import { OrganizationMapper } from '@/modules/organizations/mappers/organization.mapper';
import { OrgInviteRepository } from '@/modules/organizations/repositories/org-invite.repository';
import { OrgMemberRepository } from '@/modules/organizations/repositories/org-member.repository';
import { OrganizationRepository } from '@/modules/organizations/repositories/organization.repository';
import { UserRepository } from '@/modules/user/repositories/user.repository';

/** Default storage limit for starter plan: 50 GiB */
const STARTER_STORAGE_LIMIT_BYTES = BigInt(50) * BigInt(1024 ** 3);
/** Default seats limit for starter plan */
const STARTER_SEATS_LIMIT = 10;
/** Invite token validity in days */
const INVITE_EXPIRES_DAYS = 7;

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);

  public constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly orgMemberRepository: OrgMemberRepository,
    private readonly orgInviteRepository: OrgInviteRepository,
    @InjectRepository(OrgSubscriptionEntity)
    private readonly orgSubscriptionRepository: Repository<OrgSubscriptionEntity>,
    private readonly userRepository: UserRepository,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Organizations CRUD ──────────────────────────────────────────────────────

  public async createOrganization(
    user: UserEntity,
    dto: OrganizationCreateRequestDto,
  ): Promise<OrganizationResponseDto> {
    const existing = await this.organizationRepository.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`Organization with slug "${dto.slug}" already exists`);
    }

    const subscription = await this.organizationRepository.manager.transaction(async (em) => {
      const org = em.create(OrganizationEntity, {
        name: dto.name,
        slug: dto.slug,
        planType: PlanType.Starter,
      });
      const savedOrg = await em.save(org);

      const sub = em.create(OrgSubscriptionEntity, {
        orgId: savedOrg.id,
        storageLimitBytes: STARTER_STORAGE_LIMIT_BYTES.toString(),
        seatsLimit: STARTER_SEATS_LIMIT,
        storageBackend: StorageBackend.Local,
      });
      const savedSub = await em.save(sub);

      const member = em.create(OrgMemberEntity, {
        orgId: savedOrg.id,
        userId: user.id,
        role: OrgMemberRole.Owner,
      });
      await em.save(member);

      return { org: savedOrg, sub: savedSub };
    });

    return OrganizationMapper.toResponse(subscription.org, subscription.sub);
  }

  public async getCurrentUserOrganizations(user: UserEntity): Promise<OrganizationResponseDto[]> {
    const members = await this.orgMemberRepository.find({
      where: { userId: user.id },
      relations: { organization: true },
    });

    const orgIds = members.map((m) => m.orgId);
    if (!orgIds.length) return [];

    const subscriptions = await this.orgSubscriptionRepository.findBy(orgIds.map((id) => ({ orgId: id })));
    const subMap = new Map(subscriptions.map((s) => [s.orgId, s]));

    return members.map((m) => OrganizationMapper.toResponse(m.organization, subMap.get(m.orgId)));
  }

  public async getOrganization(orgId: string, user: UserEntity): Promise<OrganizationResponseDto> {
    const org = await this.organizationRepository.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    const member = await this.orgMemberRepository.findByOrgAndUser(orgId, user.id);
    if (!member) throw new ForbiddenException();

    const subscription = await this.orgSubscriptionRepository.findOne({ where: { orgId } });
    return OrganizationMapper.toResponse(org, subscription);
  }

  public async getOrganizationEntity(orgId: string): Promise<OrganizationEntity> {
    const org = await this.organizationRepository.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  public async updateStorageConfig(orgId: string, storageBackend: StorageBackend, storageConfigEncrypted: string | null): Promise<void> {
    const sub = await this.orgSubscriptionRepository.findOne({ where: { orgId } });
    if (!sub) throw new NotFoundException('Subscription not found');

    sub.storageBackend = storageBackend;
    sub.storageConfigEncrypted = storageConfigEncrypted;
    await this.orgSubscriptionRepository.save(sub);
  }

  public async updateOrganization(orgId: string, dto: OrganizationUpdateRequestDto): Promise<OrganizationResponseDto> {
    const org = await this.organizationRepository.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    const updated = this.organizationRepository.merge(org, dto);
    const saved = await this.organizationRepository.save(updated);

    const subscription = await this.orgSubscriptionRepository.findOne({ where: { orgId } });
    return OrganizationMapper.toResponse(saved, subscription);
  }

  // ─── Members ─────────────────────────────────────────────────────────────────

  public async getMembers(
    orgId: string,
    pagination: PaginationDto,
  ): Promise<PaginationResponseDto<OrgMemberResponseDto>> {
    const org = await this.organizationRepository.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    const qb = this.orgMemberRepository
      .createQueryBuilder('member')
      .innerJoinAndSelect('member.user', 'user')
      .where('member.orgId = :orgId', { orgId })
      .orderBy('member.createdAt', 'ASC');

    if (pagination.skip) qb.skip(pagination.skip);
    if (pagination.size) qb.take(pagination.size);

    const [members, count] = await qb.getManyAndCount();
    return PaginationResponseDto.build(
      members.map(OrganizationMapper.toMemberResponse),
      count,
      pagination.size,
      pagination.skip,
      pagination.sort,
    );
  }

  public async changeMemberRole(
    orgId: string,
    actorMember: OrgMemberEntity,
    targetUserId: string,
    role: OrgMemberRole,
  ): Promise<void> {
    const targetMember = await this.orgMemberRepository.findByOrgAndUser(orgId, targetUserId);
    if (!targetMember) throw new NotFoundException('Member not found');

    if (targetMember.role === OrgMemberRole.Owner) {
      throw new ForbiddenException('Cannot change the role of the organization owner');
    }

    if (actorMember.userId === targetUserId) {
      throw new ForbiddenException('Cannot change your own role');
    }

    // Actor must outrank the new role they're assigning
    if (OrgMemberRoleWeights[actorMember.role] <= OrgMemberRoleWeights[role]) {
      throw new ForbiddenException('Cannot assign a role equal to or higher than your own');
    }

    targetMember.role = role;
    await this.orgMemberRepository.save(targetMember);
  }

  public async removeMember(orgId: string, actorUser: UserEntity, targetUserId: string): Promise<void> {
    const targetMember = await this.orgMemberRepository.findByOrgAndUser(orgId, targetUserId);
    if (!targetMember) throw new NotFoundException('Member not found');

    if (targetMember.role === OrgMemberRole.Owner) {
      throw new ForbiddenException('Cannot remove the organization owner');
    }

    const isSelf = actorUser.id === targetUserId;
    if (!isSelf) {
      const actorMember = await this.orgMemberRepository.findByOrgAndUser(orgId, actorUser.id);
      if (!actorMember || OrgMemberRoleWeights[actorMember.role] < OrgMemberRoleWeights[OrgMemberRole.Admin]) {
        throw new ForbiddenException('Insufficient permissions to remove members');
      }
    }

    await this.orgMemberRepository.softDelete({ id: targetMember.id });
  }

  // ─── Invites ─────────────────────────────────────────────────────────────────

  public async inviteMember(orgId: string, dto: OrgInviteCreateRequestDto): Promise<void> {
    const org = await this.organizationRepository.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    const subscription = await this.orgSubscriptionRepository.findOne({ where: { orgId } });
    if (subscription?.seatsLimit !== null && subscription?.seatsLimit !== undefined) {
      const memberCount = await this.orgMemberRepository.countByOrg(orgId);
      if (memberCount >= subscription.seatsLimit) {
        throw new ConflictException('Organization has reached its seat limit');
      }
    }

    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      const existingMember = await this.orgMemberRepository.findByOrgAndUser(orgId, existingUser.id);
      if (existingMember) {
        throw new ConflictException('User is already a member of this organization');
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRES_DAYS);

    const invite = this.orgInviteRepository.create({
      orgId,
      invitedEmail: dto.email,
      role: dto.role,
      token: randomUUID(),
      expiresAt,
      acceptedAt: null,
    });
    const savedInvite = await this.orgInviteRepository.save(invite);

    const subject = `You're invited to join ${org.name} on MeshHub`;
    const text = `You have been invited to join the organization "${org.name}" with the role "${savedInvite.role}".\n\nAccept the invitation by clicking the link below:\n${this.configService.app.frontendUrl}/invite/accept?token=${savedInvite.token}\n\nThis link expires in ${INVITE_EXPIRES_DAYS} days.`;

    this.notificationsService.sendEmail(dto.email, subject, text).catch((e: unknown) => {
      this.logger.error('Failed to send invite email', e);
    });
  }

  public async acceptInvite(token: string): Promise<void> {
    const invite = await this.orgInviteRepository.findActiveByToken(token);
    if (!invite) {
      throw new UnprocessableEntityException('Invite not found or has expired');
    }

    const user = await this.userRepository.findByEmail(invite.invitedEmail);
    if (!user) {
      throw new UnprocessableEntityException('Please register with this email address first');
    }

    const existingMember = await this.orgMemberRepository.findByOrgAndUser(invite.orgId, user.id);
    if (existingMember) {
      throw new ConflictException('Already a member of this organization');
    }

    await this.orgMemberRepository.manager.transaction(async (em) => {
      const member = em.create(OrgMemberEntity, {
        orgId: invite.orgId,
        userId: user.id,
        role: invite.role,
      });
      await em.save(member);

      invite.acceptedAt = new Date();
      await em.save(invite);
    });
  }
}
