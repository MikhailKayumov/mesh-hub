import { pbkdf2, randomBytes } from 'node:crypto';
import { PaginationDto, PaginationResponseDto } from '@decorators/pagination';
import { UserEntity } from '@entities/user/user.entity';
import { UserCreateRequestDto } from '@modules/user/dto/user.create.request.dto';
import { UserResponseDto } from '@modules/user/dto/user.response.dto';
import { UserUpdateRequestDto } from '@modules/user/dto/user.update.request.dto';
import { UserMapper } from '@modules/user/user.mapper';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { isNil } from '../../utils';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  private readonly logger: Logger = new Logger('UserService');

  public constructor(private readonly userRepository: UserRepository) {}

  public async getUsers({ size, skip }: PaginationDto): Promise<PaginationResponseDto<UserResponseDto>> {
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
    );
  }

  public async getUser(id: string): Promise<UserResponseDto> {
    const user = await this.findUserById(id);
    return UserMapper.userEntityToUserResponse(user);
  }

  public async createUser(dto: UserCreateRequestDto): Promise<UserResponseDto> {
    const { hash, salt } = await this.encodePassword(dto.password);

    const user = await this.userRepository.createUser(dto, hash, salt);

    return UserMapper.userEntityToUserResponse(await user.save());
  }

  public async updateUser(id: string, dto: UserUpdateRequestDto): Promise<UserResponseDto> {
    const user = await this.findUserById(id);

    const updates = Object.entries(dto) as [keyof UserUpdateRequestDto, any][];
    updates.forEach(([name, value]) => {
      user[name] = value;
    });

    return UserMapper.userEntityToUserResponse(await user.save());
  }

  public async deleteUser(id: string) {
    return this.userRepository.delete({ id });
  }

  public async findUserById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findUser({ id });
    if (!user) {
      throw new HttpException(`User with id (${id}) not found!`, HttpStatus.NOT_FOUND);
    }

    return user;
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
}
