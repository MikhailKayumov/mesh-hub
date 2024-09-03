export const MODEL_3D_PATH_PREFIX = '/api/models-3d/files';

export function getThumbnailSrc(fileId: string, thumbnail?: string) {
  return thumbnail ? `${MODEL_3D_PATH_PREFIX}/${fileId}/thumbnail` : null;
}

export function getModel3DFileSrc(fileId: string, name: string) {
  return `${MODEL_3D_PATH_PREFIX}/${fileId}/${name}`;
}
