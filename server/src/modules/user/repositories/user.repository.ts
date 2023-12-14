import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';
import { UserEntity } from '@/database/entities/user/user.entity';

@Injectable()
export class UserRepository extends Repository<UserEntity> {
  public constructor(
    @InjectRepository(UserEntity)
    private repository: Repository<UserEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public async findUsers(where: FindOptionsWhere<UserEntity> = {}) {
    const qb = this.createQueryBuilder('user');
    qb.where({ ...where });

    return await qb.getManyAndCount();
  }

  public async findUser(options: FindOneOptions<UserEntity> = {}) {
    return await this.findOne(options);
  }

  public async findById(id: string, { where = {}, ...options }: FindOneOptions<UserEntity> = {}) {
    return this.findUser({
      where: { id, ...where },
      ...options,
    });
  }

  public async findByEmail(email: string, { where = {}, relations = {}, ...options }: FindOneOptions<UserEntity> = {}) {
    return this.findUser({
      relations: { ...relations },
      where: { email, ...where },
      ...options,
    });
  }
}
