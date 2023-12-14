import { CgSoftEntity } from '@/database/entities/resources/cg-soft.entity';
import { UserMetaEntity } from '@/database/entities/user/user-meta.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { CgSoftRequest } from '@/modules/common/resources/dto/cg-soft.request';
import { CgSoftMapper } from '@/modules/common/resources/mappers/cg-soft.mapper';
import { UserCurrentResponseDto } from '@/modules/user/dto/user.current.response.dto';
import { UserCurrentUpdateRequestDto } from '@/modules/user/dto/user.current.update.request.dto';
import { UserMetaResponseDto } from '@/modules/user/dto/user.meta.response.dto';

export class UserMapper {
  public static toCurrentUserResponse(user: UserEntity): UserCurrentResponseDto {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      isConfirmed: user.isConfirmed,
      meta: this.toUserMetaResponse(user.userMeta),
    };
  }

  public static toUserMetaResponse(meta: UserMetaEntity): UserMetaResponseDto {
    // console.log(meta);
    return {
      id: meta.id,
      aboutYourself: meta.aboutYourself,
      favoriteSoft: (meta.favoriteSoft ?? []).map(CgSoftMapper.toResponse),
    };
  }

  public static fromUserCurrentUpdaterRequest({
    aboutYourself,
    favoriteSoft,
    ...updates
  }: UserCurrentUpdateRequestDto): Pick<UserEntity, 'firstName' | 'middleName' | 'lastName' | 'phone'> & {
    userMeta?: Partial<Omit<UserMetaEntity, 'favoriteSoft'>>;
    favoriteSoft?: { new: CgSoftRequest[]; exist: Partial<CgSoftEntity>[] };
  } {
    return {
      ...updates,
      userMeta: { aboutYourself },
      favoriteSoft: favoriteSoft?.reduce<{ new: CgSoftRequest[]; exist: Partial<CgSoftEntity>[] }>(
        (acc, s) => {
          if (s.id === 'new') acc.new.push(s);
          else if (typeof s.id === 'number') acc.exist.push(s as any);

          return acc;
        },
        {
          new: [],
          exist: [],
        },
      ),
    };
  }
}
