import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ValidationErrorMessages } from '@/constants';

export class LoginRequestDto {
  @ApiProperty()
  @IsNotEmpty({ message: ValidationErrorMessages.RequiredField })
  @IsEmail({}, { message: ValidationErrorMessages.Email })
  public email: string;

  @ApiProperty()
  @IsNotEmpty({ message: ValidationErrorMessages.RequiredField })
  @IsString()
  @MinLength(6, { message: ValidationErrorMessages.PasswordLength })
  public password: string;
}
