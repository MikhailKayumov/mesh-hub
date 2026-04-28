import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SceneCommentCreateRequestDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  public body: string;

  @IsOptional()
  @IsUUID()
  public parentId?: string;
}
