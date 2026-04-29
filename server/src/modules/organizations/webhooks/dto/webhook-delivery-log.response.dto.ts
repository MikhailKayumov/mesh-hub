import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebhookDeliveryLogResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public event: string;

  @ApiPropertyOptional({ type: Number, nullable: true })
  public responseStatus: number | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  public deliveredAt: Date | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  public failedAt: Date | null;

  @ApiProperty()
  public createdAt: Date;
}
