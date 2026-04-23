import { ModelVersionEntity } from '@/database/entities/models-3d/model-version.entity';
import { VersionResponseDto, VersionUploaderDto } from './dto/version.response.dto';

export class ModelVersionMapper {
  public static toResponse(version: ModelVersionEntity): VersionResponseDto {
    const uploader: VersionUploaderDto = {
      id: version.uploader.id,
      firstName: version.uploader.firstName ?? undefined,
      lastName: version.uploader.lastName ?? undefined,
      avatar: version.uploader.userMeta?.avatar ?? undefined,
    };

    return {
      id: version.id,
      versionNumber: version.versionNumber,
      fileName: version.fileName,
      fileSize: Number(version.fileSize),
      entryFile: version.entryFile ?? null,
      changeNotes: version.changeNotes ?? null,
      isActive: version.isActive,
      uploader,
      createdAt: version.createdAt.toISOString(),
    };
  }
}
