import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelViewLogEntity } from '@/database/entities/embed/model-view-log.entity';
import { DailyViewDto, OriginViewDto } from '@/modules/embed/dto/view-analytics.response.dto';

@Injectable()
export class ModelViewLogRepository extends Repository<ModelViewLogEntity> {
  private readonly logger = new Logger(ModelViewLogRepository.name);

  public constructor(
    @InjectRepository(ModelViewLogEntity)
    private readonly repository: Repository<ModelViewLogEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  public createLog(embedProjectId: string, modelId: string, origin?: string): void {
    const entity = this.create({
      embedProjectId,
      modelId,
      origin: origin ?? null,
    });
    this.save(entity).catch((err) => this.logger.error('Failed to save view log', err));
  }

  public async getDailyViews(embedProjectId: string, days = 30): Promise<DailyViewDto[]> {
    const rows: { date: string; count: string }[] = await this.createQueryBuilder('log')
      .select("TO_CHAR(DATE(log.created_at), 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('log.embed_project_id = :embedProjectId', { embedProjectId })
      .andWhere(`log.created_at >= NOW() - INTERVAL '${days} days'`)
      .groupBy('DATE(log.created_at)')
      .orderBy('DATE(log.created_at)', 'ASC')
      .getRawMany();

    return rows.map((r) => ({ date: r.date, count: Number(r.count) }));
  }

  public async getTopOrigins(embedProjectId: string, limit = 10): Promise<OriginViewDto[]> {
    const rows: { origin: string; count: string }[] = await this.createQueryBuilder('log')
      .select('log.origin', 'origin')
      .addSelect('COUNT(*)', 'count')
      .where('log.embed_project_id = :embedProjectId', { embedProjectId })
      .andWhere('log.origin IS NOT NULL')
      .groupBy('log.origin')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return rows.map((r) => ({ origin: r.origin, count: Number(r.count) }));
  }

  public getTotalViews(embedProjectId: string): Promise<number> {
    return this.count({ where: { embedProjectId } });
  }
}
