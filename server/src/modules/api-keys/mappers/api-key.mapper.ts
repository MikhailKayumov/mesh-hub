import { ApiKeyEntity } from '@/database/entities/embed/api-key.entity';
import { ApiKeyResponseDto } from '@/modules/api-keys/dto/api-key.response.dto';

export class ApiKeyMapper {
  public static toResponse(entity: ApiKeyEntity, rawKey?: string): ApiKeyResponseDto {
    const dto = new ApiKeyResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.prefix = entity.prefix;
    dto.scopes = entity.scopes;
    dto.lastUsedAt = entity.lastUsedAt;
    dto.expiresAt = entity.expiresAt;
    dto.revokedAt = entity.revokedAt;
    if (rawKey !== undefined) {
      dto.rawKey = rawKey;
    }
    return dto;
  }
}
