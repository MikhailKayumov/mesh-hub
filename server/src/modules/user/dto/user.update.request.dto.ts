import { IsOptional, IsString } from 'class-validator';

export class UserUpdateRequestDto {
  @IsOptional()
  @IsString()
  public firstName?: string;

  @IsOptional()
  @IsString()
  public middleName?: string;

  @IsOptional()
  @IsString()
  public lastName?: string;

  @IsOptional()
  @IsString()
  public nickname?: string;
}
