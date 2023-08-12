import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard, IAuthModuleOptions } from '@nestjs/passport';
import { getAuthenticateOptions, isSessionValid } from './utils';

@Injectable()
export class JwtRefreshAuthGuard extends PassportAuthGuard('jwt-refresh') {
  public getAuthenticateOptions(): IAuthModuleOptions | undefined {
    return getAuthenticateOptions('JwtRefresh');
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    return isSessionValid(context);
  }
}
