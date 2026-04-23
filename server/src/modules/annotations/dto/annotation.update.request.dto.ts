import { IsInt, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class AnnotationUpdateRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
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
  @IsInt()
  public order?: number;
}
