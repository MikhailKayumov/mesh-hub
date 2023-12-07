import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { AppRegexp, UserRole, UserRoles, ValidationErrorMessages } from '@/constants';

export class UserCreateRequestDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(AppRegexp.RussianPhone, { message: ValidationErrorMessages.Phone })
  public phone?: string;

  @ApiPropertyOptional({ enum: UserRoles, isArray: true, enumName: 'UserRoles' })
  @IsOptional()
  @IsEnum(UserRoles, { each: true })
  public roles?: UserRole[];

  public password?: string;
}
