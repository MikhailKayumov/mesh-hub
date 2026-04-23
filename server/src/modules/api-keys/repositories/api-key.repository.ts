import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKeyEntity } from '@/database/entities/embed/api-key.entity';

@Injectable()
export class ApiKeyRepository extends Repository<ApiKeyEntity> {
  public constructor(
    @InjectRepository(ApiKeyEntity)
    private readonly repository: Repository<ApiKeyEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public findByHash(keyHash: string): Promise<ApiKeyEntity | null> {
    return this.findOne({ where: { keyHash }, relations: { organization: true } });
  }

  public findByOrg(orgId: string): Promise<ApiKeyEntity[]> {
    return this.find({ where: { orgId }, order: { createdAt: 'DESC' } });
  }
}
