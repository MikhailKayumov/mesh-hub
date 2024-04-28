import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserRole, UserRoles } from '@/constants';
import { SessionEntity } from '@/database/entities/session/session.entity';
import { ALLOWED_ROLES_KEY, IS_PUBLIC_KEY, IS_REFRESH_KEY } from '@/decorators/auth/auth.decorator';
import { AuthService } from '@/modules/auth/auth.service';
import { ConfigService } from '@/modules/common/config/config.service';
import { UserRoleHelper } from '@/utils/user-role.helper';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = <Request>context.switchToHttp().getRequest();

    const [session, isValid] = await this.authService.validateSession(
      request?.cookies?.[this.configService.jwt.cookieName],
      request.ip,
      request.headers['user-agent'],
    );
    request.session = session;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const isRefresh = this.reflector.getAllAndOverride<boolean>(IS_REFRESH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if ((!isValid && !isRefresh) || !request.session || !request.session.user) {
      throw new UnauthorizedException();
    }

    if (!request.session.user.isActive || !this.validateRoles(request.session, context)) {
      throw new ForbiddenException();
    }

    return true;
  }

  private validateRoles(session: SessionEntity, context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<UserRole[]>(ALLOWED_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!allowedRoles?.length) return true;
    if (!session.user?.roles?.length) return false;

    return (
      UserRoleHelper.hasSomeRoles(session.user, allowedRoles) ||
      UserRoleHelper.hasRole(session.user, UserRoles.SuperUser)
    );
  }
}
