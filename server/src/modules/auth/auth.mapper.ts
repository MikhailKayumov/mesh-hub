import { SessionEntity } from '@/database/entities/session/session.entity';
import { SessionResponseDto } from '@/modules/auth/dto/session.response.dto';
import { UserMapper } from '@/modules/user/user.mapper';

export class AuthMapper {
  public static sessionEntityToResponse(sessionEntity: SessionEntity): SessionResponseDto {
    return {
      id: sessionEntity.id,
      ip: sessionEntity.ip,
      userAgent: sessionEntity.userAgent,
      user: UserMapper.userEntityToUserResponse(sessionEntity.user),
    };
  }
}
