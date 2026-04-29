import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookEntity } from '@/database/entities/organizations/webhook.entity';

@Injectable()
export class WebhookRepository extends Repository<WebhookEntity> {
  public constructor(
    @InjectRepository(WebhookEntity)
    private repository: Repository<WebhookEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public listForOrg(orgId: string): Promise<WebhookEntity[]> {
    return this.find({ where: { orgId }, order: { createdAt: 'DESC' } });
  }

  public findOneForOrg(orgId: string, webhookId: string): Promise<WebhookEntity | null> {
    return this.findOne({ where: { id: webhookId, orgId } });
  }

  /**
   * Returns active webhooks for the given org that are subscribed to the given event.
   */
  public findActiveForEvent(orgId: string, event: string): Promise<WebhookEntity[]> {
    return this.createQueryBuilder('w')
      .where('w.orgId = :orgId', { orgId })
      .andWhere('w.isActive = true')
      .andWhere('w.deletedAt IS NULL')
      .andWhere(':event = ANY(w.events)', { event })
      .getMany();
  }
}
