export const MODEL_3D_PATH_PREFIX = '/api/models-3d/files';

export function getThumbnailSrc(modelId: string, thumbnail?: string) {
  return thumbnail ? `${MODEL_3D_PATH_PREFIX}/${modelId}/thumbnail` : null;
}

export function getModel3DFileSrc(modelId: string, name: string) {
  return `${MODEL_3D_PATH_PREFIX}/${modelId}/${name}`;
}

export function getModel3DVersionFileSrc(modelId: string, versionId: string, fileName: string) {
  return `${MODEL_3D_PATH_PREFIX}/${modelId}/versions/${versionId}/${fileName}`;
}
