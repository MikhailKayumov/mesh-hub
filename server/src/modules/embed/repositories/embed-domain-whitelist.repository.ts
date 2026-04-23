import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmbedDomainWhitelistEntity } from '@/database/entities/embed/embed-domain-whitelist.entity';

@Injectable()
export class EmbedDomainWhitelistRepository extends Repository<EmbedDomainWhitelistEntity> {
  public constructor(
    @InjectRepository(EmbedDomainWhitelistEntity)
    private readonly repository: Repository<EmbedDomainWhitelistEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public hardDeleteByProjectAndDomain(embedProjectId: string, domain: string): Promise<void> {
    return this.createQueryBuilder()
      .delete()
      .where('embed_project_id = :embedProjectId AND domain = :domain', { embedProjectId, domain })
      .execute()
      .then(() => undefined);
  }
}
