import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { OrgMemberRole as OrgMemberRoleEnum } from '@/database/entities/organizations/org-member.entity';
import { OrgMemberGuard } from './org-member.guard';

export const ORG_MEMBER_ROLE_KEY = 'orgMemberRole';

/**
 * Apply to controller routes that require the caller to be a member of the target org
 * with at least the given role. The route must expose :id matching the organization UUID.
 */
export const OrgMemberRole = (...roles: OrgMemberRoleEnum[]) =>
  applyDecorators(SetMetadata(ORG_MEMBER_ROLE_KEY, roles), UseGuards(OrgMemberGuard));
