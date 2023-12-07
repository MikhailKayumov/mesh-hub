import { SessionEntity } from '@/database/entities/session/session.entity';
import { SessionResponseDto } from '@/modules/auth/dto/session.response.dto';

export class AuthMapper {
  public static toSessionResponse(sessionEntity: SessionEntity): SessionResponseDto {
    return {
      id: sessionEntity.id,
      ip: sessionEntity.ip,
      userAgent: sessionEntity.userAgent,
    };
  }
}
