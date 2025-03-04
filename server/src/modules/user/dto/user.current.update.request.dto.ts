import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';
import { AppRegexp, ValidationErrorMessages } from '@/constants';
import { CgSoftRequest } from '@/modules/resources/dto/cg-soft.request';

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

  @ApiPropertyOptional({ type: () => CgSoftRequest, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CgSoftRequest)
  public favoriteSoft?: CgSoftRequest[];
}
