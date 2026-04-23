import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CommentCreateRequestDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  public body: string;

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
  @IsUUID()
  public parentId?: string;
}
