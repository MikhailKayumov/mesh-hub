import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export const passwordRegExp = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).*$/;

export class LoginRequestDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Обязательное поле' })
  @IsEmail({}, { message: 'Не корректный электронный адрес' })
  public email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Обязательное поле' })
  @IsString()
  @MinLength(6, { message: 'Длина пароля должна быть более 6 символов' })
  @Matches(passwordRegExp, {
    message: 'Пароль должен содержать строчные и прописные буквы латинского алфавита и цифры',
  })
  public password: string;
}
