import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StorageBackend } from '@/database/entities/organizations/org-subscription.entity';
import { PlanType } from '@/database/entities/organizations/organization.entity';

export class OrgSubscriptionDetailDto {
  @ApiProperty({ enum: PlanType })
  public planType: PlanType;

  @ApiPropertyOptional({ type: String, nullable: true })
  public storageLimitBytes: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  public seatsLimit: number | null;

  @ApiProperty({ enum: StorageBackend })
  public storageBackend: StorageBackend;

  @ApiProperty({ description: 'Total bytes used by all models in this org' })
  public storageUsedBytes: number;
}
