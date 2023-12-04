import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResetPasswordRequestDto {
  @ApiProperty()
  @IsEmail()
  public email: string;
}
