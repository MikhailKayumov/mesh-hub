import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { AppRegexp, ValidationErrorMessages } from '@/constants';

export class UserUpdateRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: ValidationErrorMessages.RequiredField })
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
  @Matches(AppRegexp.RussianPhone, { message: ValidationErrorMessages.Phone })
  public phone?: string;
}
