import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class UserCreateRequestDto {
  @ApiProperty()
  @IsEmail()
  public email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(8, 24)
  @Matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).*$/)
  public password: string;

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
