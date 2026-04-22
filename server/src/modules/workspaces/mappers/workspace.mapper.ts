import { WorkspaceEntity } from '@/database/entities/workspaces/workspace.entity';
import { WorkspaceResponseDto } from '@/modules/workspaces/dto/workspace.response.dto';

export class WorkspaceMapper {
  public static toResponse(entity: WorkspaceEntity, memberCount = 0): WorkspaceResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      orgId: entity.orgId,
      memberCount,
      createdAt: entity.createdAt,
    };
  }
}
