import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CommentUpdateRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  public body?: string;

  @IsOptional()
  @IsBoolean()
  public resolved?: boolean;
}
