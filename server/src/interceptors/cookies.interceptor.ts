import { ConfigService } from '@config/config.service';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { addSeconds } from 'date-fns';
import { Response } from 'express';
import { map, Observable } from 'rxjs';

@Injectable()
export class CookiesInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Cookies Interceptor');

  public constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() === 'http') {
      return this.setAuthCookie(context, next);
    } else {
      throw new InternalServerErrorException();
    }
  }

  private setAuthCookie(context: ExecutionContext, next: CallHandler) {
    const { session } = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data: unknown) => {
        if (session) {
          /*
            maxAge: a number representing the milliseconds from Date.now() for expiry
            expires: a Date object indicating the cookie’s expiration date (expires at the end of session by default).
            path: a string indicating the path of the cookie (/ by default).
            domain: a string indicating the domain of the cookie (no default).
            sameSite: a boolean or string indicating whether the cookie is a “same site” cookie (false by default). This can be set to 'strict', 'lax', 'none', or true (which maps to 'strict').
            secure: a boolean indicating whether the cookie is only to be sent over HTTPS (false by default for HTTP, true by default for HTTPS). If this is set to true and Node.js is not directly over a TLS connection, be sure to read how to setup Express behind proxies or the cookie may not ever set correctly.
            httpOnly: a boolean indicating whether the cookie is only to be sent over HTTP(S), and not made available to client JavaScript (true by default).
            signed: a boolean indicating whether the cookie is to be signed (true by default).
            overwrite: a boolean indicating whether to overwrite previously set cookies of the same name (true by default).
          */
          response.cookie('x-access-token', session.accessToken, {
            httpOnly: true,
            maxAge: this.configService.jwt.accessExpiresIn * 1000,
            expires: addSeconds(new Date(), this.configService.jwt.accessExpiresIn),
          });
        }

        return data;
      }),
    );
  }
}
