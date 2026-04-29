import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsHexColor, IsIn, IsNumber, IsObject, IsOptional, Max, Min } from 'class-validator';

export class DisplayConfigUpdateDto {
  @IsOptional()
  @IsHexColor()
  @ApiPropertyOptional()
  public backgroundColor?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  @ApiPropertyOptional()
  public ambientIntensity?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional()
  public fogEnabled?: boolean;

  @IsOptional()
  @IsIn(['linear', 'exp2'])
  @ApiPropertyOptional({ enum: ['linear', 'exp2'] })
  public fogType?: string;

  @IsOptional()
  @IsHexColor()
  @ApiPropertyOptional()
  public fogColor?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  public fogNear?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  public fogFar?: number;

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional()
  public postProcess?: Record<string, any>;

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional()
  public rendererConfig?: Record<string, any>;
}
