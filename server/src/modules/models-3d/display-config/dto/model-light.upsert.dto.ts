import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsHexColor, IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

const LIGHT_TYPES = ['ambient', 'directional', 'point', 'spot'] as const;

export class ModelLightUpsertDto {
  @IsString()
  @IsIn(LIGHT_TYPES)
  @ApiProperty({ enum: LIGHT_TYPES })
  public type: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  public posX?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  public posY?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  public posZ?: number;

  @IsOptional()
  @IsHexColor()
  @ApiPropertyOptional()
  public color?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiPropertyOptional()
  public intensity?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional()
  public castShadow?: boolean;
}

export class ModelLightUpdateDto {
  @IsOptional()
  @IsString()
  @IsIn(LIGHT_TYPES)
  @ApiPropertyOptional({ enum: LIGHT_TYPES })
  public type?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  public posX?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  public posY?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  public posZ?: number;

  @IsOptional()
  @IsHexColor()
  @ApiPropertyOptional()
  public color?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiPropertyOptional()
  public intensity?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional()
  public castShadow?: boolean;
}
