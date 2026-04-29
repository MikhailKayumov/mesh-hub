import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsHexColor, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class MaterialOverrideUpsertDto {
  @IsOptional()
  @IsHexColor()
  @ApiPropertyOptional()
  public colorHex?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @ApiPropertyOptional()
  public metalness?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @ApiPropertyOptional()
  public roughness?: number;

  @IsOptional()
  @IsHexColor()
  @ApiPropertyOptional()
  public emissiveHex?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  @ApiPropertyOptional()
  public emissiveIntensity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @ApiPropertyOptional()
  public opacity?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional()
  public wireframe?: boolean;
}
