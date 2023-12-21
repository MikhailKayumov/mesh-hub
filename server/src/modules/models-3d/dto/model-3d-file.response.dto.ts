import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Model3dFileResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public createdAt: Date;

  @ApiPropertyOptional()
  public updatedAt?: Date;

  @ApiProperty()
  public name: string;

  @ApiProperty()
  public size: number;

  @ApiProperty()
  public extension: string;
}
