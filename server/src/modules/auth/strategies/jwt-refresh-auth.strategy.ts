import { ConfigService } from '@config/config.service';
import { SessionEntity } from '@entities/session/session.entity';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { extractJwt, getStrategyOptions } from './utils';

@Injectable()
export class JwtRefreshAuthStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  public constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super(getStrategyOptions('JwtRefresh', configService.jwt.accessSecret));
  }

  public async validate(request: Request, payload: { userId: string }): Promise<SessionEntity | never> {
    return this.authService.validateSession(extractJwt(request)!, payload.userId);
  }
}
