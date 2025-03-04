import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserRole } from '@/constants';
import { RoleEntity } from '@/database/entities/user/role.entity';

@Injectable()
export class RoleRepository extends Repository<RoleEntity> {
  public constructor(
    @InjectRepository(RoleEntity)
    private repository: Repository<RoleEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public async getByNames(names: UserRole[]): Promise<RoleEntity[]> {
    if (!names?.length) return [];
    return this.findBy({ name: In(names) });
  }

  public async getById(id: number): Promise<RoleEntity | null> {
    return this.findOne({ where: { id } });
  }

  public async getByName(name: UserRole): Promise<RoleEntity | null> {
    return this.findOne({ where: { name } });
  }
}
