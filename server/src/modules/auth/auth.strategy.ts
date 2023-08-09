import { ConfigService } from '@config/config.service';
import { SessionEntity } from '@entities/session/session.entity';
import { AuthService } from '@modules/auth/auth.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class AuthStrategy extends PassportStrategy(Strategy) {
  public constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken()]),
      ignoreExpiration: false,
      secretOrKey: configService.jwt.accessSecret,
      passReqToCallback: true,
    });
  }

  public async validate(
    request: Request,
    payload: { userId: string; userEmail: string; iat: number; exp: number },
  ): Promise<SessionEntity | never> {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    if (!token) {
      throw new UnauthorizedException();
    }

    return this.authService.validateSession(token, payload.userId);
  }
}
