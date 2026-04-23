import { createHash } from 'crypto';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyRepository } from '@/modules/api-keys/repositories/api-key.repository';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  public constructor(private readonly apiKeyRepository: ApiKeyRepository) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const rawKey = request.headers['x-api-key'];

    if (!rawKey || typeof rawKey !== 'string') {
      throw new UnauthorizedException();
    }

    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await this.apiKeyRepository.findByHash(keyHash);

    if (!apiKey) {
      throw new UnauthorizedException();
    }

    if (apiKey.revokedAt !== null) {
      throw new UnauthorizedException();
    }

    if (apiKey.expiresAt !== null && apiKey.expiresAt < new Date()) {
      throw new UnauthorizedException();
    }

    // Fire-and-forget — do not block the request on this update
    this.apiKeyRepository.update(apiKey.id, { lastUsedAt: new Date() }).catch(() => undefined);

    request.apiKey = apiKey;
    return true;
  }
}
