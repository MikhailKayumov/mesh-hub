import { OrgMemberEntity } from '@/database/entities/organizations/org-member.entity';
import { OrgSubscriptionEntity } from '@/database/entities/organizations/org-subscription.entity';
import { OrganizationEntity } from '@/database/entities/organizations/organization.entity';
import { OrgMemberResponseDto } from '@/modules/organizations/dto/org-member.response.dto';
import { OrganizationResponseDto } from '@/modules/organizations/dto/organization.response.dto';

export class OrganizationMapper {
  public static toResponse(
    entity: OrganizationEntity,
    subscription?: OrgSubscriptionEntity | null,
  ): OrganizationResponseDto {
    const dto: OrganizationResponseDto = {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      planType: entity.planType,
      createdAt: entity.createdAt,
    };

    if (subscription) {
      dto.subscription = {
        storageLimitBytes: subscription.storageLimitBytes,
        seatsLimit: subscription.seatsLimit,
        storageBackend: subscription.storageBackend,
      };
    }

    return dto;
  }

  public static toMemberResponse(member: OrgMemberEntity): OrgMemberResponseDto {
    return {
      userId: member.userId,
      email: member.user.email,
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      role: member.role,
      joinedAt: member.createdAt,
    };
  }
}
