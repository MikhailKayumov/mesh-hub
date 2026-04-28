export const MAX_AVATAR_FILE_SIZE = 1024 ** 2; // 1mb

export const ALLOWED_AVATAR_FILE_TYPES = [
  'image/png',
  'image/gif',
  'image/jpeg',
  'image/svg+xml',
  'image/webp',
  'image/avif',
];

export const DEFAULT_MAX_3D_MODEL_FILE_SIZE = 3 * 1024 ** 3; // 3gb

/** Backwards-compatible alias of the default per-file upload limit. */
export const MAX_3D_MODEL_FILE_SIZE = DEFAULT_MAX_3D_MODEL_FILE_SIZE;

/** Per-extension maximum upload size (bytes). Keys are lowercase extensions including the dot. */
export const MODEL_MAX_SIZE_BYTES: Record<string, number> = {
  '.glb': 3 * 1024 ** 3,
  '.gltf': 3 * 1024 ** 3,
  '.fbx': 3 * 1024 ** 3,
  '.obj': 500 * 1024 ** 2,
  '.mtl': 10 * 1024 ** 2,
  '.dae': 1024 ** 3,
  '.stl': 500 * 1024 ** 2,
  '.zip': 3 * 1024 ** 3,
};

export const ACCEPTED_3D_MODEL_FILE_TYPES = ['.glb', '.gltf', '.fbx', '.obj', '.dae', '.stl', '.zip'];
