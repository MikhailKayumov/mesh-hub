import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID } from 'class-validator';

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
}
