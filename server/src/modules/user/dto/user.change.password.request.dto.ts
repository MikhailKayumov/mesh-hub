import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { AppRegexp, ValidationErrorMessages } from '@/constants';

export class UserChangePasswordRequestDto {
  @ApiProperty()
  @IsNotEmpty({ message: ValidationErrorMessages.RequiredField })
  @IsString()
  @MinLength(6, { message: ValidationErrorMessages.PasswordLength })
  @Matches(AppRegexp.Password, { message: ValidationErrorMessages.PasswordContent })
  public oldPassword: string;

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
