import { ApiProperty } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public type: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  public payload: Record<string, unknown>;

  @ApiProperty()
  public isRead: boolean;

  @ApiProperty()
  public createdAt: Date;
}

export class UnreadCountResponseDto {
  @ApiProperty()
  public count: number;
}
