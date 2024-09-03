import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { AppRegexp, ValidationErrorMessages } from '@/constants';

export class SignupRequestDto {
  @ApiProperty()
  @IsEmail()
  public email: string;

  @ApiProperty()
  @IsNotEmpty({ message: ValidationErrorMessages.RequiredField })
  @IsString()
  public firstName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public middleName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public lastName?: string;

  @ApiProperty()
  @IsNotEmpty({ message: ValidationErrorMessages.RequiredField })
  @IsString()
  @MinLength(6, { message: ValidationErrorMessages.PasswordLength })
  @Matches(AppRegexp.Password, { message: ValidationErrorMessages.PasswordContent })
  public password: string;

  @ApiProperty()
  @IsNotEmpty({ message: ValidationErrorMessages.RequiredField })
  @IsString()
  @MinLength(6, { message: ValidationErrorMessages.PasswordLength })
  @Matches(AppRegexp.Password, { message: ValidationErrorMessages.PasswordContent })
  public confirmPassword: string;
}
