import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public ip: string;

  @ApiProperty()
  public createdAt: Date;

  @ApiPropertyOptional()
  public updatedAt?: Date;

  @ApiProperty()
  public expireAt: Date;

  @ApiPropertyOptional()
  public userAgent?: string;
}
