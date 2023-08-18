import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard, IAuthModuleOptions } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends PassportAuthGuard('jwt') {
  public getAuthenticateOptions(): IAuthModuleOptions | undefined {
    return {
      defaultStrategy: 'jwt',
      property: 'session',
    };
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const { session } = this.getRequest<Request>(context);
    if (!session) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
