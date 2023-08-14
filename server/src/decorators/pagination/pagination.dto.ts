import { ApiPropertyOptional } from '@nestjs/swagger';
import validateDto from '@utils/validate-dto';
import { IsInt, Min, IsOptional, IsNumber } from 'class-validator';

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

  // todo: order

  public constructor(skip?: number, size?: number) {
    this.skip = skip;
    this.size = size;
  }

  public static async build(skip?: number, size?: number) {
    const dto = new PaginationDto(
      skip !== undefined && isNaN(skip) ? undefined : skip,
      size !== undefined && isNaN(size) ? undefined : size,
    );

    await validateDto(dto);

    return dto;
  }
}
