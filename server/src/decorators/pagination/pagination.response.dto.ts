import { ApiPropertyOptional } from '@nestjs/swagger';
import validateDto from '@utils/validate-dto';
import { IsBoolean, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class PaginationResponseDto<T = unknown> {
  public readonly data: T[];

  @ApiPropertyOptional()
  @IsInt()
  @IsNumber({ allowNaN: false })
  @Min(0)
  @IsOptional()
  public skip: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsNumber({ allowNaN: false })
  @Min(1)
  @IsOptional()
  public size: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsNumber({ allowNaN: false })
  @Min(0)
  @IsOptional()
  public totalCount: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  public hasMore: boolean;

  constructor(data: T[], totalCount: number, size?: number, skip = 0) {
    this.data = data;
    this.skip = skip;
    this.size = size || data.length;
    this.totalCount = totalCount;
    this.hasMore = !(size && (totalCount <= size || totalCount <= size + skip || this.data.length < size));
  }

  public static async build<T = any>(data: T[], totalCount: number, size?: number, skip?: number) {
    const dto = new PaginationResponseDto<T>(data, totalCount, size, skip);

    await validateDto(dto);

    return dto;
  }
}
