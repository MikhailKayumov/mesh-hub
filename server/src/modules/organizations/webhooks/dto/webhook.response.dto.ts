import { ApiProperty } from '@nestjs/swagger';

export class WebhookResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public url: string;

  @ApiProperty({ type: [String] })
  public events: string[];

  @ApiProperty()
  public isActive: boolean;

  @ApiProperty()
  public createdAt: Date;
}
