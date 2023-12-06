import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { AppRegexp, ValidationErrorMessages } from '@/constants';

export class UserCurrentUpdateRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: ValidationErrorMessages.RequiredField })
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
  @Matches(AppRegexp.RussianPhone, { message: ValidationErrorMessages.Phone })
  public phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public aboutYourself?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  public favoriteSoft?: string[];
}
