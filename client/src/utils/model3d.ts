export function getThumbnailSrc(fileId: string, thumbnail?: string) {
  return thumbnail ? `/files/models-3d/${fileId}/${thumbnail}` : null;
}

export function getModel3DFileSrc(fileId: string, name: string) {
  return `/files/models-3d/${fileId}/${name}`;
}
