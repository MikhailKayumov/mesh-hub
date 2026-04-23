import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Matches } from 'class-validator';
import { LightType } from '@/database/entities/scenes/scene-light.entity';

export class SceneLightUpsertDto {
  @ApiProperty({ enum: LightType })
  @IsEnum(LightType)
  public type: LightType;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  public posX?: number;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  public posY?: number;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  public posZ?: number;

  @ApiProperty({ default: '#ffffff' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  public color?: string;

  @ApiProperty({ default: 1.0 })
  @IsOptional()
  @IsNumber()
  public intensity?: number;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  public castShadow?: boolean;
}
