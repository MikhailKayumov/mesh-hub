import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class AnnotationCreateRequestDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
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
  @IsInt()
  public order?: number;
}
