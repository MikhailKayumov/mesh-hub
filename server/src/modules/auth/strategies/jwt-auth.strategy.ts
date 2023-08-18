import { ConfigService } from '@config/config.service';
import { SessionEntity } from '@entities/session/session.entity';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
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
    private readonly jwtService: JwtService,
  ) {
    // super(getStrategyOptions('JwtAccess', configService.jwt.accessSecret), (req: any, payload: any, done: any) => {
    //   console.log(req.cookies);
    //   console.log(payload);
    //   done(null, payload);
    // });
    super({
      jwtFromRequest: extractJwt,
      ignoreExpiration: true,
      secretOrKey: configService.jwt.accessSecret,
      algorithms: configService.jwt.algorithm,
      passReqToCallback: true,
    });
  }

  public async validate(request: Request, payload: { userId: string }): Promise<SessionEntity | never> {
    const token = extractJwt(request)!;

    const [session, result] = await Promise.all([
      this.authService.validateSession(token, payload.userId),
      this.validateAccessToken(token),
    ]);

    request.session = session;
    if (!result) {
      request.session = await this.authService.refreshSession(session);
    }

    return request.session;
  }

  private async validateAccessToken(token: string): Promise<boolean> {
    try {
      await this.jwtService.verifyAsync(token);
      return true;
    } catch (e: unknown) {
      this.logger.warn('Access token has been expire');
      return false;
    }
  }
}
