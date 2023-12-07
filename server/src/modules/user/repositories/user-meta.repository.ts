import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMetaEntity } from '@/database/entities/user/user-meta.entity';

@Injectable()
export class UserMetaRepository extends Repository<UserMetaEntity> {
  public constructor(
    @InjectRepository(UserMetaEntity)
    private repository: Repository<UserMetaEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
