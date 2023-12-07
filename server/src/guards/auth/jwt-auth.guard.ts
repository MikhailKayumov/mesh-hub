import { ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard as PassportAuthGuard, IAuthModuleOptions } from '@nestjs/passport';
import { Request } from 'express';
import { UserRole } from '@/constants';
import { SessionEntity } from '@/database/entities/session/session.entity';
import { ALLOWED_ROLES_KEY, IS_PUBLIC_KEY } from '@/decorators/auth/auth.decorator';
import { UserRoleHelper } from '@/utils/user-role.helper';

@Injectable()
export class JwtAuthGuard extends PassportAuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  public getAuthenticateOptions(): IAuthModuleOptions | undefined {
    return {
      defaultStrategy: 'jwt',
      property: 'jwtPayload',
    };
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    await super.canActivate(context);

    const { session } = this.getRequest(context) as Request;
    if (!session || !session.user) {
      throw new UnauthorizedException();
    }

    // if (!session.user.isActive || !this.validateRoles(session, context)) {
    //   throw new ForbiddenException();
    // }

    return true;
  }

  private validateRoles(session: SessionEntity, context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<UserRole[]>(ALLOWED_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!allowedRoles || !allowedRoles.length) return true;
    if (!session.user?.roles?.length) return false;

    return UserRoleHelper.hasSomeRoles(session.user, allowedRoles);
  }
}
