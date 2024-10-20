import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ValidationErrorMessages } from '@/constants';
import { CategoryRequest } from '@/modules/resources/dto/category.request';

export class Model3dUpdateRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: ValidationErrorMessages.RequiredField })
  public name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  public isVisible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  public description?: Record<string, any>;

  @ApiPropertyOptional({ type: () => CategoryRequest, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryRequest)
  public categories?: CategoryRequest[];
}
