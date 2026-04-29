import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

export class AnimationSequenceItemDto {
  @ApiProperty()
  @IsString()
  public name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public loop?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  public transitionDuration?: number;
}

export class AnimationConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  public autoplay?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  public activeClipName?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public loop?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  public speed?: number;

  @ApiPropertyOptional({ type: [AnimationSequenceItemDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AnimationSequenceItemDto)
  public sequence?: AnimationSequenceItemDto[];
}

export class SceneObjectAudioConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  public audioId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  public loop?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  public volume?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  public positional?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  public maxDistance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  public autoplay?: boolean;
}

export class SceneObjectUpsertDto {
  @ApiProperty()
  @IsUUID()
  public modelId: string;

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

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  public rotX?: number;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  public rotY?: number;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  public rotZ?: number;

  @ApiProperty({ default: 1 })
  @IsOptional()
  @IsNumber()
  public scaleX?: number;

  @ApiProperty({ default: 1 })
  @IsOptional()
  @IsNumber()
  public scaleY?: number;

  @ApiProperty({ default: 1 })
  @IsOptional()
  @IsNumber()
  public scaleZ?: number;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  public order?: number;

  @ApiPropertyOptional({ type: AnimationConfigDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => AnimationConfigDto)
  public animationConfig?: AnimationConfigDto | null;

  @ApiPropertyOptional({ type: SceneObjectAudioConfigDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => SceneObjectAudioConfigDto)
  public audioConfig?: SceneObjectAudioConfigDto | null;
}
