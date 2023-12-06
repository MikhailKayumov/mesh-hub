import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { ValidationErrorMessages } from '@/constants';

export class UserResetPasswordRequestDto {
  @ApiProperty()
  @IsNotEmpty({ message: ValidationErrorMessages.RequiredField })
  @IsEmail({}, { message: ValidationErrorMessages.Email })
  public email: string;
}
