import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export const passwordRegExp = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).*$/;

export class LoginRequestDto {
  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 24)
  @Matches(passwordRegExp)
  public password: string;
}
