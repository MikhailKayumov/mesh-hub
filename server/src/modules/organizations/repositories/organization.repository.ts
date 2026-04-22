import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationEntity } from '@/database/entities/organizations/organization.entity';

@Injectable()
export class OrganizationRepository extends Repository<OrganizationEntity> {
  public constructor(
    @InjectRepository(OrganizationEntity)
    private repository: Repository<OrganizationEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
