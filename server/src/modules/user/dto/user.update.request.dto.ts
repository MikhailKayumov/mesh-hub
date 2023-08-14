import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UserUpdateRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public middleName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public nickname?: string;
}
