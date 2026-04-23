import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsUrl, Matches, ValidateNested } from 'class-validator';

export class BrandingConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  public logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  public primaryColor?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  public showBadge: boolean;
}

export class EmbedProjectUpdateRequestDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  public name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  public modelId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  public autoRotate?: boolean;

  @ApiPropertyOptional({ type: () => BrandingConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BrandingConfigDto)
  public brandingConfig?: BrandingConfigDto;
}
