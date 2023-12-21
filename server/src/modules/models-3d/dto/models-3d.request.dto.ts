import { ApiPropertyOptional } from '@nestjs/swagger';

// todo: validation
export class Models3dRequestDto {
  @ApiPropertyOptional()
  public search?: string;

  @ApiPropertyOptional()
  public categories?: string[];
}
