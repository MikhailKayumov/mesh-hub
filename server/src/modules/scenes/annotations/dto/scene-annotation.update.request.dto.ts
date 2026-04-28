import { IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SceneAnnotationUpdateRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  public label?: string;

  @IsOptional()
  @IsString()
  public body?: string;

  @IsOptional()
  @IsNumber()
  public posX?: number;

  @IsOptional()
  @IsNumber()
  public posY?: number;

  @IsOptional()
  @IsNumber()
  public posZ?: number;

  @IsOptional()
  @IsNumber()
  public cameraPosX?: number;

  @IsOptional()
  @IsNumber()
  public cameraPosY?: number;

  @IsOptional()
  @IsNumber()
  public cameraPosZ?: number;

  @IsOptional()
  @IsUUID()
  public sceneObjectId?: string;
}
