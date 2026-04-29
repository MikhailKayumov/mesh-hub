import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BrandingConfig } from '@/database/entities/embed/embed-project.entity';
import { Model3dResponseDto } from '@/modules/models-3d/dto/model-3d.response.dto';
import { SceneResponseDto } from '@/modules/scenes/dto/scene.response.dto';

export class EmbedViewerResponseDto {
  @ApiProperty({ enum: ['model', 'scene'] })
  public type: 'model' | 'scene';

  @ApiPropertyOptional({ type: () => Model3dResponseDto })
  public model?: Model3dResponseDto;

  @ApiPropertyOptional({ type: () => SceneResponseDto })
  public scene?: SceneResponseDto;

  @ApiPropertyOptional()
  public modelId?: string;

  @ApiPropertyOptional()
  public sceneId?: string;

  @ApiProperty({ nullable: true })
  public brandingConfig: BrandingConfig | null;

  @ApiProperty()
  public autoRotate: boolean;

  @ApiProperty({ type: [String] })
  public allowedOrigins: string[];
}
