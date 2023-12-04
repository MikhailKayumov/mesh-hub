import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class UserResetPasswordRequestDto {
  @ApiProperty()
  @IsEmail()
  public email: string;
}
