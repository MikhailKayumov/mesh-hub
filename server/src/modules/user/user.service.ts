import { pbkdf2, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { UserEntity } from '@/database/entities/user/user.entity';
import { PaginationDto, PaginationResponseDto } from '@/decorators/pagination';
import { ConfigService } from '@/modules/common/config/config.service';
import { NotificationsService } from '@/modules/common/notifications/notifications.service';
import { UserCreateRequestDto } from '@/modules/user/dto/user.create.request.dto';
import { UserResponseDto } from '@/modules/user/dto/user.response.dto';
import { UserUpdateRequestDto } from '@/modules/user/dto/user.update.request.dto';
import { UserResetPasswordRepository } from '@/modules/user/repositories/user-reset-password.repository';
import { UserMapper } from '@/modules/user/user.mapper';
import { isNil } from '@/utils';
import { UserRepository } from './repositories/user.repository';

@Injectable()
export class UserService {
  private readonly logger: Logger = new Logger('UserService');

  public constructor(
    private readonly userRepository: UserRepository,
    private readonly userResetPasswordRepository: UserResetPasswordRepository,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  public async getUsers({ size, skip, sort }: PaginationDto): Promise<PaginationResponseDto<UserResponseDto>> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.sessions', 'session')
      .orderBy('user.createdAt');

    if (!isNil(skip)) {
      qb.skip(skip);
    }
    if (size) {
      qb.take(size);
    }

    const [users, count] = await qb.getManyAndCount();

    return PaginationResponseDto.build(
      users.map((user) => UserMapper.userEntityToUserResponse(user)),
      count,
      size,
      skip,
      sort,
    );
  }

  public async getUser(id: string): Promise<UserResponseDto> {
    const user = await this.getUserById(id);
    return UserMapper.userEntityToUserResponse(user);
  }

  public async getUserById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`Пользователь не найден`);
    }

    return user;
  }

  public async createUser(dto: UserCreateRequestDto): Promise<UserResponseDto> {
    return UserMapper.userEntityToUserResponse(await this.createUserEntity(dto));
  }

  public async createUserEntity(dto: UserCreateRequestDto): Promise<UserEntity> {
    const exist = await this.userRepository.findByEmail(dto.email);
    if (exist) {
      throw new ConflictException('Пользователь уже зарегистрирован');
    }

    const { hash, salt } = await this.encodePassword(dto.password);

    const user = UserMapper.createRequestToUserEntity(dto);
    user.password = hash;
    user.salt = salt;

    return await this.userRepository.save(user);
  }

  public async updateUser(id: string, dto: UserUpdateRequestDto): Promise<UserResponseDto> {
    const user = await this.getUserById(id);

    const updates = Object.entries(dto) as [keyof UserUpdateRequestDto, any][];
    updates.forEach(([name, value]) => {
      user[name] = value;
    });

    return UserMapper.userEntityToUserResponse(await user.save());
  }

  public async deleteUser(id: string): Promise<void> {
    const result = await this.userRepository.delete({ id });

    if (!result.affected) {
      throw new NotFoundException('Пользователь не найден!');
    }
  }

  public async encodePassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
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

  public async comparePassword(password: string, salt: string, passwordHash: string): Promise<boolean> {
    const { hash } = await this.encodePassword(password, salt);
    return hash === passwordHash;
  }

  public async changePassword(user: UserEntity, oldPassword: string, password: string, confirmPassword: string) {
    if (!(await this.comparePassword(oldPassword, user.salt, user.password))) {
      throw new BadRequestException('Текущий пароль неверен');
    }

    await this.updatePassword(user, password, confirmPassword);
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

  public async newPassword(id: string, password: string, confirmPassword: string): Promise<void> {
    const request = await this.userResetPasswordRepository.getById(id);
    if (!request || !request.user) {
      throw new NotFoundException('Заявка на сброс пароля не найдена или устарела');
    }

    await this.updatePassword(request.user, password, confirmPassword);
    await this.userResetPasswordRepository.delete({ id: request.id });
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
}
