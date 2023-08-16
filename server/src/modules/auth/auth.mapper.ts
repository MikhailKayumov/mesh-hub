import { SessionEntity } from '@entities/session/session.entity';
import { SessionResponseDto } from '@modules/auth/dto/session.response.dto';
import { UserMapper } from '@modules/user/user.mapper';

export class AuthMapper {
  public static sessionEntityToResponse(sessionEntity: SessionEntity, withToken = false): SessionResponseDto {
    return {
      id: sessionEntity.id,
      token: withToken ? sessionEntity.accessToken : undefined,
      user: sessionEntity.user ? UserMapper.userEntityToUserResponse(sessionEntity.user) : undefined,
    };
  }
}
