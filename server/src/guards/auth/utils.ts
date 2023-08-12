import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { IAuthModuleOptions } from '@nestjs/passport';
import type { JwtStrategyType } from '@modules/auth/types';

export function getAuthenticateOptions(type: JwtStrategyType): IAuthModuleOptions {
  return {
    defaultStrategy: type === 'JwtAccess' ? 'jwt' : 'jwt-refresh',
    property: 'session',
  };
}

export function isSessionValid(context: ExecutionContext) {
  const { session } = context.switchToHttp().getRequest();
  if (!session) {
    throw new UnauthorizedException();
  }

  return session;
}
