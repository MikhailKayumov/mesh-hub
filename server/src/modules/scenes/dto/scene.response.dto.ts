import { ApiProperty } from '@nestjs/swagger';
import { SceneConfig } from '@/database/entities/scenes/scene-config.type';
import { LightType } from '@/database/entities/scenes/scene-light.entity';

export class SceneObjectFileDto {
  @ApiProperty({ nullable: true })
  public entryFile?: string;
}

export class SceneObjectModelDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public name: string;

  @ApiProperty({ type: SceneObjectFileDto })
  public file: SceneObjectFileDto;
}

export class SceneObjectResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty({ type: SceneObjectModelDto })
  public model: SceneObjectModelDto;

  @ApiProperty()
  public posX: number;

  @ApiProperty()
  public posY: number;

  @ApiProperty()
  public posZ: number;

  @ApiProperty()
  public rotX: number;

  @ApiProperty()
  public rotY: number;

  @ApiProperty()
  public rotZ: number;

  @ApiProperty()
  public scaleX: number;

  @ApiProperty()
  public scaleY: number;

  @ApiProperty()
  public scaleZ: number;

  @ApiProperty()
  public order: number;

  @ApiProperty()
  public createdAt: Date;
}

export class SceneLightResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty({ enum: LightType })
  public type: LightType;

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
  public createdAt: Date;
}

export class SceneResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public workspaceId: string;

  @ApiProperty()
  public name: string;

  @ApiProperty({ nullable: true })
  public description: string | null;

  @ApiProperty({ nullable: true })
  public config: SceneConfig | null;

  @ApiProperty({ nullable: true })
  public thumbnailPath: string | null;

  @ApiProperty({ type: [SceneObjectResponseDto] })
  public objects: SceneObjectResponseDto[];

  @ApiProperty({ type: [SceneLightResponseDto] })
  public lights: SceneLightResponseDto[];

  @ApiProperty()
  public createdAt: Date;

  @ApiProperty({ nullable: true })
  public updatedAt: Date | null;
}

export class SceneListItemResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public workspaceId: string;

  @ApiProperty()
  public name: string;

  @ApiProperty({ nullable: true })
  public description: string | null;

  @ApiProperty({ nullable: true })
  public thumbnailPath: string | null;

  @ApiProperty()
  public objectCount: number;

  @ApiProperty()
  public createdAt: Date;
}
