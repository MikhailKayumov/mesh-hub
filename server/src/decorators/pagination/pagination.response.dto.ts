import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNumber, Min } from 'class-validator';
import { PaginationDtoSortItem } from '@/decorators/pagination/pagination.dto';
import validateDto from '@/utils/validate-dto';

export class PaginationResponseDto<T = unknown> {
  @ApiProperty({ isArray: true, type: Object })
  @IsArray()
  public readonly data: T[];

  @ApiProperty()
  @IsNumber({ allowNaN: false })
  @IsInt()
  @Min(0)
  public skip: number;

  @ApiProperty()
  @IsNumber({ allowNaN: false })
  @IsInt()
  @Min(0)
  public size: number;

  @ApiProperty({ type: () => PaginationDtoSortItem, isArray: true })
  @Type(() => PaginationDtoSortItem)
  @IsArray()
  public sort: PaginationDtoSortItem[];

  @ApiProperty()
  @IsNumber({ allowNaN: false })
  @IsInt()
  @Min(0)
  public totalCount: number;

  @ApiProperty()
  @IsBoolean()
  public hasMore: boolean;

  public constructor(data: T[], totalCount: number, size?: number, skip = 0, sort: PaginationDtoSortItem[] = []) {
    this.data = data;
    this.skip = skip;
    this.size = size || data.length;
    this.sort = sort;
    this.totalCount = totalCount;
    this.hasMore = !(size && (totalCount <= size || totalCount <= size + skip || this.data.length < size));
  }

  public static async build<T = any>(
    data: T[],
    totalCount: number,
    size?: number,
    skip?: number,
    sort?: PaginationDtoSortItem[],
  ) {
    const dto = new PaginationResponseDto<T>(data, totalCount, size, skip, sort);

    await validateDto(dto);

    return dto;
  }
}
