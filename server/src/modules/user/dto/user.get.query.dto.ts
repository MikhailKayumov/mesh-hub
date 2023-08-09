import { IsOptional, IsString } from 'class-validator';

export class UserGetQueryDto {
  @IsOptional()
  @IsString()
  public search?: string;
}
