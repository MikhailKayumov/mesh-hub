import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

// todo: validation
export class Models3dRequestDto {
  @ApiPropertyOptional()
  public search?: string;

  @ApiPropertyOptional()
  public categories?: string[];

  @ApiPropertyOptional({ description: 'Filter models belonging to this workspace' })
  @IsOptional()
  @IsUUID()
  public workspaceId?: string;
}
