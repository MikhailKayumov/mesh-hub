export const MAX_AVATAR_FILE_SIZE = 1024 ** 2; // 1mb

export const MAX_3D_MODEL_FILE_SIZE = 1024 ** 3 * 3; // 3gb (default / coarse Dropzone limit)

export const ACCEPTED_3D_MODEL_FILE_TYPES = ['.glb', '.gltf', '.fbx', '.obj', '.dae', '.stl', '.zip'];

export const MAX_3D_MODEL_FILE_SIZES: Record<string, number> = {
  '.glb': 1024 ** 3 * 3, // 3gb
  '.gltf': 1024 ** 3 * 3, // 3gb
  '.fbx': 1024 ** 3 * 3, // 3gb
  '.obj': 1024 ** 2 * 500, // 500mb
  '.mtl': 1024 ** 2 * 10, // 10mb
  '.dae': 1024 ** 3, // 1gb
  '.stl': 1024 ** 2 * 500, // 500mb
  '.zip': 1024 ** 3 * 3, // 3gb
};
