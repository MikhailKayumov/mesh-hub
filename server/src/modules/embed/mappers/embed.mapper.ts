import { EmbedProjectEntity } from '@/database/entities/embed/embed-project.entity';
import { EmbedProjectResponseDto } from '@/modules/embed/dto/embed-project.response.dto';
import { EmbedViewerResponseDto } from '@/modules/embed/dto/embed-viewer.response.dto';
import { DailyViewDto, OriginViewDto, ViewAnalyticsResponseDto } from '@/modules/embed/dto/view-analytics.response.dto';
import { Model3dResponseDto } from '@/modules/models-3d/dto/model-3d.response.dto';
import { SceneResponseDto } from '@/modules/scenes/dto/scene.response.dto';

export class EmbedMapper {
  public static toProjectResponse(project: EmbedProjectEntity): EmbedProjectResponseDto {
    const dto = new EmbedProjectResponseDto();
    dto.id = project.id;
    dto.orgId = project.orgId;
    dto.name = project.name;
    dto.modelId = project.modelId;
    dto.sceneId = project.sceneId;
    dto.autoRotate = project.autoRotate;
    dto.brandingConfig = project.brandingConfig;
    dto.allowedOrigins = (project.domains ?? []).map((d) => d.domain);
    dto.createdAt = project.createdAt;
    dto.updatedAt = project.updatedAt ?? undefined;
    return dto;
  }

  public static toViewerModelResponse(model: Model3dResponseDto, project: EmbedProjectEntity): EmbedViewerResponseDto {
    const dto = new EmbedViewerResponseDto();
    dto.type = 'model';
    dto.model = model;
    dto.modelId = model.id;
    dto.brandingConfig = project.brandingConfig;
    dto.autoRotate = project.autoRotate;
    dto.allowedOrigins = (project.domains ?? []).map((d) => d.domain);
    return dto;
  }

  public static toViewerSceneResponse(scene: SceneResponseDto, project: EmbedProjectEntity): EmbedViewerResponseDto {
    const dto = new EmbedViewerResponseDto();
    dto.type = 'scene';
    dto.scene = scene;
    dto.sceneId = scene.id;
    dto.brandingConfig = project.brandingConfig;
    dto.autoRotate = project.autoRotate;
    dto.allowedOrigins = (project.domains ?? []).map((d) => d.domain);
    return dto;
  }

  public static toAnalyticsResponse(
    dailyViews: DailyViewDto[],
    topOrigins: OriginViewDto[],
    totalViews: number,
  ): ViewAnalyticsResponseDto {
    const dto = new ViewAnalyticsResponseDto();
    dto.dailyViews = dailyViews;
    dto.topOrigins = topOrigins;
    dto.totalViews = totalViews;
    return dto;
  }
}
