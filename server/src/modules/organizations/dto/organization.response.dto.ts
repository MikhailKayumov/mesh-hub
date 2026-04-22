import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StorageBackend } from '@/database/entities/organizations/org-subscription.entity';
import { PlanType } from '@/database/entities/organizations/organization.entity';

export class OrgSubscriptionSummaryDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  public storageLimitBytes: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  public seatsLimit: number | null;

  @ApiProperty({ enum: StorageBackend })
  public storageBackend: StorageBackend;
}

export class OrganizationResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public name: string;

  @ApiProperty()
  public slug: string;

  @ApiProperty({ enum: PlanType })
  public planType: PlanType;

  @ApiProperty()
  public createdAt: Date;

  @ApiPropertyOptional({ type: () => OrgSubscriptionSummaryDto })
  public subscription?: OrgSubscriptionSummaryDto;
}
