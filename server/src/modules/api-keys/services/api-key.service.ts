import { createHash, randomBytes } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiKeyEntity } from '@/database/entities/embed/api-key.entity';
import { ApiKeyCreateRequestDto } from '@/modules/api-keys/dto/api-key.create.request.dto';
import { ApiKeyResponseDto } from '@/modules/api-keys/dto/api-key.response.dto';
import { ApiKeyMapper } from '@/modules/api-keys/mappers/api-key.mapper';
import { ApiKeyRepository } from '@/modules/api-keys/repositories/api-key.repository';

@Injectable()
export class ApiKeyService {
  public constructor(private readonly apiKeyRepository: ApiKeyRepository) {}

  public async generate(dto: ApiKeyCreateRequestDto): Promise<ApiKeyResponseDto> {
    const randomPart = randomBytes(32).toString('base64url');
    const prefix = randomPart.substring(0, 8);
    const rawKey = `${prefix}_${randomPart}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');

    const entity = this.apiKeyRepository.create({
      name: dto.name,
      orgId: dto.orgId,
      prefix,
      keyHash,
      lastUsedAt: null,
      expiresAt: null,
      revokedAt: null,
    } as Partial<ApiKeyEntity>);

    const saved = await this.apiKeyRepository.save(entity);
    return ApiKeyMapper.toResponse(saved, rawKey);
  }

  public async list(orgId: string): Promise<ApiKeyResponseDto[]> {
    const entities = await this.apiKeyRepository.findByOrg(orgId);
    return entities.map((e) => ApiKeyMapper.toResponse(e));
  }

  public async revoke(keyId: string, orgId: string): Promise<void> {
    const entity = await this.apiKeyRepository.findOne({ where: { id: keyId, orgId } });
    if (!entity) {
      throw new NotFoundException('API key not found');
    }
    entity.revokedAt = new Date();
    await this.apiKeyRepository.save(entity);
  }
}
