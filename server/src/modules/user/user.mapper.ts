import { UserEntity } from '@entities/user/user.entity';
import { AuthMapper } from '@modules/auth/auth.mapper';
import { UserCreateRequestDto } from '@modules/user/dto/user.create.request.dto';
import { UserResponseDto } from '@modules/user/dto/user.response.dto';

export class UserMapper {
  public static createRequestToUserEntity(dto: UserCreateRequestDto): UserEntity {
    const user = new UserEntity();

    user.email = dto.email;
    user.firstName = dto.firstName;
    user.middleName = dto.middleName;
    user.lastName = dto.lastName;

    return user;
  }

  public static userEntityToUserResponse(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      nickname: user.nickname,
      sessions: user?.sessions?.map(AuthMapper.sessionEntityToResponse),
    };
  }
}
