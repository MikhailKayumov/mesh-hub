import { pbkdf2, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { In, QueryFailedError } from 'typeorm';
import { UserRoles } from '@/constants';
import { UserMetaEntity } from '@/database/entities/user/user-meta.entity';
import { UserEntity } from '@/database/entities/user/user.entity';
import { ConfigService } from '@/modules/common/config/config.service';
import { FileStorageService } from '@/modules/common/files/file-storage.service';
import { NotificationsService } from '@/modules/common/notifications/notifications.service';
import { CgSoftRepository } from '@/modules/common/resources/repositories/cg-soft.repository';
import { UserChangePasswordRequestDto } from '@/modules/user/dto/user.change.password.request.dto';
import { UserCreateRequestDto } from '@/modules/user/dto/user.create.request.dto';
import { UserCurrentResponseDto } from '@/modules/user/dto/user.current.response.dto';
import { UserCurrentUpdateRequestDto } from '@/modules/user/dto/user.current.update.request.dto';
import { UserNewPasswordRequestDto } from '@/modules/user/dto/user.new.password.request.dto';
import { UserMapper } from '@/modules/user/mappers/user.mapper';
import { RoleRepository } from '@/modules/user/repositories/role.repository';
import { UserMetaRepository } from '@/modules/user/repositories/user-meta.repository';
import { UserResetPasswordRepository } from '@/modules/user/repositories/user-reset-password.repository';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService {
  private readonly logger: Logger = new Logger('UserService');

  public constructor(
    private readonly userRepository: UserRepository,
    private readonly userMetaRepository: UserMetaRepository,
    private readonly roleRepository: RoleRepository,
    private readonly userResetPasswordRepository: UserResetPasswordRepository,
    private readonly cgSoftRepository: CgSoftRepository,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
    private readonly fileStorageService: FileStorageService,
  ) {}

  public async getCurrentUser(id: string): Promise<UserCurrentResponseDto> {
    const user = await this.getUserById(id);
    return UserMapper.toCurrentUserResponse(user);
  }

  public async updateCurrentUser(user: UserEntity, dto: UserCurrentUpdateRequestDto): Promise<UserCurrentResponseDto> {
    if (dto.phone && (await this.userRepository.exist({ where: { phone: dto.phone } }))) {
      throw new ConflictException('Номер телефона уже занят другим пользователем');
    }

    const { favoriteSoft, ...updates } = UserMapper.fromUserCurrentUpdaterRequest(dto);
    const entity = this.userRepository.merge(await this.getUserById(user.id), updates);

    if (favoriteSoft) {
      const newSoft = favoriteSoft.new.length ? await this.cgSoftRepository.createManyCGSoft(favoriteSoft.new) : [];
      const existSoft = favoriteSoft.exist.length
        ? await this.cgSoftRepository.findBy({ id: In(favoriteSoft.exist.map((s) => s.id)) })
        : [];

      entity.userMeta.favoriteSoft = existSoft.concat(newSoft);
    }

    return UserMapper.toCurrentUserResponse(await this.userRepository.save(entity));
  }

  public async updateCurrentUserAvatar(user: UserEntity, file?: Express.Multer.File): Promise<void> {
    try {
      user.userMeta.avatar && (await this.fileStorageService.removeAvatar(user.userMeta.avatar));
    } catch (e: any) {
      if (e?.code === 'ENOENT') {
        this.logger.debug(`There is no avatar at "${user.userMeta.avatar}"`);
      } else {
        throw new InternalServerErrorException('Не удалось удалить предыдущий аватар. Попробуйте позже');
      }
    }

    try {
      if (file) {
        const avatar = `${user.id}_${Date.now()}`;
        user.userMeta.avatar = await this.fileStorageService.saveAvatar(avatar, file);
      } else {
        user.userMeta.avatar = null!;
      }

      await this.userRepository.save(user);
    } catch (e) {
      throw new UnprocessableEntityException('Не удалось сохранить файл аватара. Попробуйте позже');
    }
  }

  public async createUserEntity(dto: UserCreateRequestDto): Promise<UserEntity> {
    if (await this.userRepository.exist({ where: { email: dto.email } })) {
      throw new ConflictException('Пользователь уже зарегистрирован');
    }

    // todo: generate temporary password
    const { hash, salt } = await this.encodePassword(dto.password ?? 'TEMPORARY_PASSWORD');
    const { roles = [UserRoles.User] } = dto;
    const user = new UserEntity();

    user.email = dto.email;
    user.firstName = dto.firstName;
    user.middleName = dto.middleName;
    user.lastName = dto.lastName;
    user.isConfirmed = true;
    user.isActive = true;
    user.roles = await this.roleRepository.getByNames(roles);
    user.password = hash;
    user.salt = salt;
    user.userMeta = new UserMetaEntity();

    return this.userRepository.save(user);
  }

  public async resetPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    try {
      await this.userResetPasswordRepository.deleteExpiredByUser(user);
      const request = await this.userResetPasswordRepository.createRequest(user);

      this.notificationsService.sendEmail(
        user.email,
        'Сброс пароля',
        `Для создания нового пароля перейдите по ссылке:\n${this.configService.app.frontendUrl}/auth/new-password?request=${request.id}`,
      );
    } catch (e) {
      if (e instanceof QueryFailedError) {
        throw new BadRequestException('Запрос на сброс пароля можно создать только один раз в 30 минут');
      } else {
        throw new InternalServerErrorException('Не удалось создать запрос на сброс пароля');
      }
    }
  }

  public async newPassword({ requestId, password, confirmPassword }: UserNewPasswordRequestDto): Promise<void> {
    const request = await this.userResetPasswordRepository.getById(requestId);
    if (!request || !request.user) {
      throw new NotFoundException('Заявка на сброс пароля не найдена или устарела');
    }

    await this.updatePassword(request.user, password, confirmPassword);
    await this.userResetPasswordRepository.delete({ id: request.id });
  }

  public async changePassword(user: UserEntity, dto: UserChangePasswordRequestDto) {
    if (!(await this.comparePassword(dto.oldPassword, user.salt, user.password))) {
      throw new BadRequestException('Текущий пароль неверен');
    }

    await this.updatePassword(user, dto.password, dto.confirmPassword);
  }

  public async comparePassword(password: string, salt: string, passwordHash: string): Promise<boolean> {
    const { hash } = await this.encodePassword(password, salt);
    return hash === passwordHash;
  }

  private async encodePassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    if (typeof salt !== 'string') {
      salt = randomBytes(256).toString('base64');
    }

    return new Promise<{ hash: string; salt: string }>((resolve, reject) => {
      pbkdf2(password, <string>salt, 100000, 64, 'sha512', (err, key) => {
        if (err) {
          return reject(err);
        }

        resolve({
          hash: key.toString('hex'),
          salt: <string>salt,
        });
      });
    });
  }

  private async updatePassword(user: UserEntity, password: string, confirmPassword: string): Promise<void> {
    if (password !== confirmPassword) {
      throw new BadRequestException('Пароли должны совпадать');
    }

    const encodedPassword = await this.encodePassword(password);
    user.password = encodedPassword.hash;
    user.salt = encodedPassword.salt;

    await this.userRepository.save(user);
  }

  private async getUserById(id: string): Promise<UserEntity> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.firstName',
        'user.middleName',
        'user.lastName',
        'user.email',
        'user.phone',
        'user.isConfirmed',
        'user.isActive',
        'user.password',
        'user.salt',
        'role.id',
        'role.name',
        'role.description',
        'meta.id',
        'meta.aboutYourself',
        'meta.avatar',
        'favoriteSoft.id',
        'favoriteSoft.name',
        'favoriteSoft.description',
      ])
      .innerJoin('user.roles', 'role')
      .innerJoin('user.userMeta', 'meta')
      .leftJoin('meta.favoriteSoft', 'favoriteSoft')
      .where({ id });

    const user = await qb.getOne();

    if (!user) throw new NotFoundException(`Пользователь не найден`);

    return user;
  }

  // public async getUsers({ size, skip, sort }: PaginationDto): Promise<PaginationResponseDto<UserResponseDto>> {
  //   const qb = this.userRepository
  //     .createQueryBuilder('user')
  //     .leftJoinAndSelect('user.sessions', 'session')
  //     .orderBy('user.createdAt');
  //
  //   if (!isNil(skip)) {
  //     qb.skip(skip);
  //   }
  //   if (size) {
  //     qb.take(size);
  //   }
  //
  //   const [users, count] = await qb.getManyAndCount();
  //
  //   return PaginationResponseDto.build(
  //     users.map((user) => UserMapper.toCurrentUserResponse(user)),
  //     count,
  //     size,
  //     skip,
  //     sort,
  //   );
  // }
  // public async createUser(dto: UserCreateRequestDto): Promise<UserResponseDto> {
  //   return UserMapper.toCurrentUserResponse(await this.createUserEntity(dto));
  // }
  // public async updateUser(id: string, dto: UserUpdateRequestDto): Promise<UserResponseDto> {
  //   const user = await this.getUserById(id);
  //
  //   const updates = Object.entries(dto) as [keyof UserUpdateRequestDto, any][];
  //   updates.forEach(([name, value]) => {
  //     user[name] = value;
  //   });
  //
  //   return UserMapper.toCurrentUserResponse(await user.save());
  // }
  //
  // public async deleteUser(id: string): Promise<void> {
  //   const result = await this.userRepository.delete({ id });
  //
  //   if (!result.affected) {
  //     throw new NotFoundException('Пользователь не найден!');
  //   }
  // }
}
