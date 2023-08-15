import { ApiPropertyOptional } from '@nestjs/swagger';
import validateDto from '@utils/validate-dto';
import { Type } from 'class-transformer';
import { IsInt, Min, IsOptional, IsNumber, IsString, IsEnum, IsArray, IsNotEmpty } from 'class-validator';

export enum PaginationSortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginationDtoSortItem {
  @IsString()
  @IsNotEmpty()
  public field: string;

  @IsEnum(PaginationSortOrder)
  public by: PaginationSortOrder;

  constructor(field: string, by: PaginationSortOrder) {
    this.field = field;
    this.by = by;
  }

  public static async build(field: string, by: PaginationSortOrder) {
    const dto = new PaginationDtoSortItem(field, by);
    await validateDto(dto);
    return dto;
  }
}

export class PaginationDto {
  @ApiPropertyOptional()
  @IsInt()
  @IsNumber({ allowNaN: false })
  @Min(0)
  @IsOptional()
  public skip?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsNumber({ allowNaN: false })
  @Min(1)
  public size?: number;

  @ApiPropertyOptional()
  @Type(() => PaginationDtoSortItem)
  @IsArray()
  @IsOptional()
  public sort?: PaginationDtoSortItem[];

  public constructor(skip?: number, size?: number, sort?: PaginationDtoSortItem[]) {
    this.skip = skip;
    this.size = size;
    this.sort = sort;
  }

  public static async build(skip?: number, size?: number, sort?: PaginationDtoSortItem[]) {
    const dto = new PaginationDto(
      skip !== undefined && isNaN(skip) ? undefined : skip,
      size !== undefined && isNaN(size) ? undefined : size,
      sort,
    );

    await validateDto(dto);

    return dto;
  }
}
