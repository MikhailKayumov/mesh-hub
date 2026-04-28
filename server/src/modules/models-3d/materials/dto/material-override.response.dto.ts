import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MaterialOverrideResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public modelId: string;

  @ApiProperty()
  public meshName: string;

  @ApiPropertyOptional()
  public colorHex?: string;

  @ApiPropertyOptional()
  public metalness?: number;

  @ApiPropertyOptional()
  public roughness?: number;

  @ApiPropertyOptional()
  public emissiveHex?: string;

  @ApiPropertyOptional()
  public emissiveIntensity?: number;

  @ApiPropertyOptional()
  public opacity?: number;

  @ApiProperty()
  public wireframe: boolean;

  @ApiPropertyOptional()
  public textureMapUrl?: string;

  @ApiPropertyOptional()
  public normalMapUrl?: string;

  @ApiPropertyOptional()
  public roughnessMapUrl?: string;

  @ApiPropertyOptional()
  public metalnessMapUrl?: string;

  @ApiPropertyOptional()
  public emissiveMapUrl?: string;

  @ApiPropertyOptional()
  public aoMapUrl?: string;

  @ApiProperty()
  public createdAt: string;

  @ApiPropertyOptional()
  public updatedAt?: string;
}
