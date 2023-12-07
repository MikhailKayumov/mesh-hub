import { UserMetaEntity } from '@/database/entities/user/user-meta.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { CgSoftMapper } from '@/modules/common/resources/mappers/cg-soft.mapper';
import { UserCurrentResponseDto } from '@/modules/user/dto/user.current.response.dto';
import { UserMetaResponseDto } from '@/modules/user/dto/user.meta.response.dto';

export class UserMapper {
  public static toCurrentUserResponse(user: UserEntity): UserCurrentResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      isConfirmed: user.isConfirmed,
      meta: this.toUserMetaResponse(user.userMeta),
    };
  }

  public static toUserMetaResponse(meta: UserMetaEntity): UserMetaResponseDto {
    return {
      id: meta.id,
      aboutYourself: meta.aboutYourself,
      favoriteSoft: (meta.favoriteSoft ?? []).map(CgSoftMapper.toResponse),
    };
  }
}
