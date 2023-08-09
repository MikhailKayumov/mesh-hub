import { SessionEntity } from '@entities/session/session.entity';
import { SessionResponseDto } from '@modules/auth/dto/session.response.dto';
import { UserMapper } from '@modules/user/user.mapper';

export class AuthMapper {
  public static sessionEntityToResponse(sessionEntity: SessionEntity): SessionResponseDto {
    return {
      sessionId: sessionEntity.id,
      token: sessionEntity.accessToken,
      user: sessionEntity.user ? UserMapper.userEntityToUserResponse(sessionEntity.user) : undefined,
    };
  }
}
