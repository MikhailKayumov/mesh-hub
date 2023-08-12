import { Request } from 'express';
import { ExtractJwt, StrategyOptions } from 'passport-jwt';
import type { JwtStrategyType } from '../types';

export function extractJwt(request: Request): string | null {
  const extract = ExtractJwt.fromExtractors([
    (req: Request): string | null => req?.cookies?.['x-access-token'] ?? null,
    ExtractJwt.fromAuthHeaderAsBearerToken(),
  ]);

  return extract(request);
}

export function getStrategyOptions(type: JwtStrategyType, accessSecret: string): StrategyOptions {
  return {
    jwtFromRequest: extractJwt,
    ignoreExpiration: type === 'JwtRefresh',
    secretOrKey: accessSecret,
    passReqToCallback: true,
  };
}
