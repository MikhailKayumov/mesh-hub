import { applyDecorators, ExecutionContext, Injectable, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard, IAuthModuleOptions } from '@nestjs/passport';

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  public getAuthenticateOptions(): IAuthModuleOptions | undefined {
    return {
      defaultStrategy: 'jwt',
      property: 'session',
    };
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const request = context.switchToHttp().getRequest();
    if (!request.session) {
      throw new UnauthorizedException();
    }

    return request.session;
  }
}

export const Auth = () => applyDecorators(UseGuards());
