import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public ip: string;

  @ApiPropertyOptional()
  public userAgent?: string;
}
