import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BrandingConfig } from '@/database/entities/embed/embed-project.entity';

export class EmbedProjectResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public orgId: string;

  @ApiProperty()
  public name: string;

  @ApiProperty({ nullable: true })
  public modelId: string | null;

  @ApiProperty()
  public autoRotate: boolean;

  @ApiProperty({ nullable: true })
  public brandingConfig: BrandingConfig | null;

  @ApiProperty({ type: [String] })
  public allowedOrigins: string[];

  @ApiProperty()
  public createdAt: Date;

  @ApiPropertyOptional()
  public updatedAt?: Date;
}
