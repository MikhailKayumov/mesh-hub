import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { OrgMemberRole, OrgMemberRoleWeights } from '@/database/entities/organizations/org-member.entity';
import { OrgMemberRepository } from '@/modules/organizations/repositories/org-member.repository';
import { ORG_MEMBER_ROLE_KEY } from './org-member-role.decorator';

@Injectable()
export class OrgMemberGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    private readonly orgMemberRepository: OrgMemberRepository,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const orgId = request.params['id'];
    const userId = request.session?.user?.id;

    if (!orgId || !userId) {
      throw new ForbiddenException();
    }

    const member = await this.orgMemberRepository.findByOrgAndUser(orgId, userId);

    if (!member) {
      throw new ForbiddenException();
    }

    request.orgMember = member;

    const requiredRoles = this.reflector.getAllAndOverride<OrgMemberRole[]>(ORG_MEMBER_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const requiredWeight = Math.min(...requiredRoles.map((r) => OrgMemberRoleWeights[r]));
    const memberWeight = OrgMemberRoleWeights[member.role];

    if (memberWeight < requiredWeight) {
      throw new ForbiddenException();
    }

    return true;
  }
}
