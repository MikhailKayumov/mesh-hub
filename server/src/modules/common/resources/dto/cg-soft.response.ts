import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CgSoftResponse {
  @ApiProperty()
  public id: number;

  @ApiProperty()
  public name: string;

  @ApiPropertyOptional()
  public description?: string;
}
