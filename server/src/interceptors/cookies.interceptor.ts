import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  InternalServerErrorException,
} from '@nestjs/common';
import { subMilliseconds } from 'date-fns';
import { Request, Response } from 'express';
import { map, Observable } from 'rxjs';
import { ConfigService } from '@/modules/common/config/config.service';

@Injectable()
export class CookiesInterceptor implements NestInterceptor {
  public constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() === 'http') {
      return next.handle().pipe(
        map((data: unknown) => {
          this.setAuthCookie(context);
          return data;
        }),
      );
    } else {
      throw new InternalServerErrorException();
    }
  }

  private setAuthCookie(context: ExecutionContext) {
    const { session } = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    if (session) {
      response.cookie(this.configService.jwt.cookieName, session.accessToken, {
        httpOnly: true,
        maxAge: subMilliseconds(session.expiredAt, Date.now()).getTime(),
        secure: true,
        sameSite: this.configService.isProduction ? 'lax' : 'none',
        expires: session.expiredAt,
      });
    } else {
      response.clearCookie(this.configService.jwt.cookieName);
    }
  }
}
