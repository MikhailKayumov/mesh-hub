import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard as PassportAuthGuard, IAuthModuleOptions } from '@nestjs/passport';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '@/decorators/auth/auth.decorator';

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
    if (!session && !isPublic) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
