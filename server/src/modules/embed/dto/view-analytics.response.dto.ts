import { ApiProperty } from '@nestjs/swagger';

export class DailyViewDto {
  @ApiProperty()
  public date: string;

  @ApiProperty()
  public count: number;
}

export class OriginViewDto {
  @ApiProperty()
  public origin: string;

  @ApiProperty()
  public count: number;
}

export class ViewAnalyticsResponseDto {
  @ApiProperty({ type: [DailyViewDto] })
  public dailyViews: DailyViewDto[];

  @ApiProperty({ type: [OriginViewDto] })
  public topOrigins: OriginViewDto[];

  @ApiProperty()
  public totalViews: number;
}
