import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class EmbedProjectCreateRequestDto {
  @ApiProperty()
  @IsUUID()
  public orgId: string;

  @ApiProperty({ maxLength: 100 })
  @IsNotEmpty()
  @MaxLength(100)
  public name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  public modelId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  public sceneId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  public autoRotate?: boolean;
}
