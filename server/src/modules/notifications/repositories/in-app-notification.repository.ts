import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '@/database/entities/notifications/notification.entity';

@Injectable()
export class InAppNotificationRepository extends Repository<NotificationEntity> {
  public constructor(
    @InjectRepository(NotificationEntity)
    private repository: Repository<NotificationEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public findForUser(userId: string, limit = 50): Promise<NotificationEntity[]> {
    return this.createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .andWhere('n.deletedAt IS NULL')
      .orderBy('n.isRead', 'ASC')
      .addOrderBy('n.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  public findOneOwned(id: string, userId: string): Promise<NotificationEntity | null> {
    return this.findOne({ where: { id, userId } });
  }

  public countUnread(userId: string): Promise<number> {
    return this.count({ where: { userId, isRead: false } });
  }

  public async markRead(id: string, userId: string): Promise<void> {
    await this.update({ id, userId }, { isRead: true });
  }

  public async markAllRead(userId: string): Promise<void> {
    await this.update({ userId, isRead: false }, { isRead: true });
  }
}
