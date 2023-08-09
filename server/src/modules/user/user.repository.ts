import { UserEntity } from '@entities/user/user.entity';
import { UserCreateRequestDto } from '@modules/user/dto/user.create.request.dto';
import { UserMapper } from '@modules/user/user.mapper';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';

@Injectable()
export class UserRepository extends Repository<UserEntity> {
  public constructor(
    @InjectRepository(UserEntity)
    private repository: Repository<UserEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public async findUsers(where: FindOptionsWhere<UserEntity> = {}) {
    const qb = this.repository.createQueryBuilder('user');
    qb.where({ ...where, deletedAt: IsNull() });

    return await qb.getManyAndCount();
  }

  public async findUser(where: FindOptionsWhere<UserEntity> = {}) {
    return await this.repository.findOne({
      where: {
        ...where,
        deletedAt: IsNull(),
      },
      relations: {
        sessions: true,
      },
    });
  }

  public async findByEmail(email: string) {
    return this.repository.findOneBy({
      email,
      deletedAt: IsNull(),
    });
  }

  public async createUser(dto: UserCreateRequestDto, hash: string, salt: string, silent = false): Promise<UserEntity> {
    const exist = await this.findByEmail(dto.email);
    if (exist) {
      if (silent) return exist;
      throw new HttpException('User already exists.', HttpStatus.BAD_REQUEST);
    }

    const user = UserMapper.createRequestToUserEntity(dto);
    user.password = hash;
    user.salt = salt;

    return this.repository.save(user);
  }
}
