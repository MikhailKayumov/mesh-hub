import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '@/modules/auth/types';
import { ConfigService } from '@/modules/common/config/config.service';
import { AuthService } from '../auth.service';

function extractJwt(request: Request): string | null {
  const extract = ExtractJwt.fromExtractors([
    (req: Request): string | null => {
      const cookieName: string | undefined = process.env['AUTH_JWT_COOKIE_NAME'];
      if (!cookieName) {
        return null;
      }

      return req?.cookies?.[cookieName] ?? null;
    },
    // ExtractJwt.fromAuthHeaderAsBearerToken(),
  ]);

  return extract(request);
}

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy, 'jwt') {
  private logger: Logger = new Logger(JwtAuthStrategy.name);

  public constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: extractJwt,
      ignoreExpiration: true,
      secretOrKey: configService.jwt.accessSecret,
      algorithms: configService.jwt.algorithm,
      passReqToCallback: true,
    });
  }

  public async validate(request: Request, payload: JwtPayload): Promise<JwtPayload> {
    const token = extractJwt(request)!;

    if (token) {
      request.session = await this.authService.validateSession(token, payload.userId, true);
    }

    return payload;
  }
}
