import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SceneAnnotationCreateRequestDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  public label: string;

  @IsOptional()
  @IsString()
  public body?: string;

  @IsNumber()
  public posX: number;

  @IsNumber()
  public posY: number;

  @IsNumber()
  public posZ: number;

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
