import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ModelLightResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public type: string;

  @ApiProperty()
  public posX: number;

  @ApiProperty()
  public posY: number;

  @ApiProperty()
  public posZ: number;

  @ApiProperty()
  public color: string;

  @ApiProperty()
  public intensity: number;

  @ApiProperty()
  public castShadow: boolean;

  @ApiProperty()
  public createdAt: string;
}

export class DisplayConfigResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public modelId: string;

  @ApiProperty()
  public backgroundColor: string;

  @ApiProperty()
  public ambientIntensity: number;

  @ApiPropertyOptional()
  public environmentHdriPath?: string;

  @ApiProperty()
  public fogEnabled: boolean;

  @ApiProperty()
  public fogType: string;

  @ApiProperty()
  public fogColor: string;

  @ApiProperty()
  public fogNear: number;

  @ApiProperty()
  public fogFar: number;

  @ApiPropertyOptional()
  public postProcess?: Record<string, any>;

  @ApiPropertyOptional()
  public rendererConfig?: Record<string, any>;

  @ApiProperty({ type: () => ModelLightResponseDto, isArray: true })
  public lights: ModelLightResponseDto[];
}
