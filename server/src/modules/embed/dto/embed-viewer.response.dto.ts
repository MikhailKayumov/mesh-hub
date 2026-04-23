import { ApiProperty } from '@nestjs/swagger';
import { BrandingConfig } from '@/database/entities/embed/embed-project.entity';
import { Model3dResponseDto } from '@/modules/models-3d/dto/model-3d.response.dto';

export class EmbedViewerResponseDto {
  @ApiProperty({ type: () => Model3dResponseDto })
  public model: Model3dResponseDto;

  @ApiProperty({ nullable: true })
  public brandingConfig: BrandingConfig | null;

  @ApiProperty()
  public autoRotate: boolean;

  @ApiProperty({ type: [String] })
  public allowedOrigins: string[];
}
