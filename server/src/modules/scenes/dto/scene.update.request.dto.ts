import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

class CameraBookmarkDto {
  @IsString()
  public label: string;

  @IsNumber()
  public posX: number;

  @IsNumber()
  public posY: number;

  @IsNumber()
  public posZ: number;

  @IsNumber()
  public targetX: number;

  @IsNumber()
  public targetY: number;

  @IsNumber()
  public targetZ: number;
}

class SceneConfigUpdateDto {
  @IsOptional()
  @IsString()
  public backgroundColor?: string;

  @IsOptional()
  @IsNumber()
  public ambientLightIntensity?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CameraBookmarkDto)
  public cameraBookmarks?: CameraBookmarkDto[];
}

export class SceneUpdateRequestDto {
  @ApiProperty({ required: false, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  public name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  public description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => SceneConfigUpdateDto)
  public config?: SceneConfigUpdateDto;
}
