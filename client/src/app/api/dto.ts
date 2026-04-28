export interface PaginationDtoSortItem {
  field: string;
  by: 'ASC' | 'DESC';
}

export interface PaginationDto<T = any> {
  skip?: number;
  size?: number;
  sort?: string[];
  body?: T;
}

export interface PaginationResponseDto<T = any> {
  data: T[];
  skip: number;
  size: number;
  sort: PaginationDtoSortItem[];
  totalCount: number;
  hasMore: boolean;
}

export interface CgSoftRequest {
  id: string | number;
  name: string;
}

export interface CgSoftResponse {
  id: number;
  name: string;
  description?: string;
}

export interface UserMetaResponseDto {
  id: string;
  avatar?: string;
  aboutYourself?: string;
  favoriteSoft?: CgSoftResponse[];
}

export interface UserCurrentResponseDto {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  isConfirmed: boolean;
  meta: UserMetaResponseDto;
}

export interface UserCurrentUpdateRequestDto {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  phone?: string;
  aboutYourself?: string;
  favoriteSoft?: CgSoftRequest[];
}

export interface UserResetPasswordRequestDto {
  email: string;
}

export interface UserNewPasswordRequestDto {
  requestId: string;
  password: string;
  confirmPassword: string;
}

export interface UserChangePasswordRequestDto {
  oldPassword: string;
  password: string;
  confirmPassword: string;
}

export interface SignupRequestDto {
  email: string;
  firstName: string;
  lastName?: string;
  password: string;
  confirmPassword: string;
}

export interface SessionResponseDto {
  id: string;
  ip: string;
  createdAt: string;
  updatedAt?: string;
  expireAt: string;
  userAgent?: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface Model3DFileResponseDto {
  id: string;
  createdAt: string;
  updatedAt?: string;
  name: string;
  entryFile: string;
  size: number;
  extension: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  description?: string;
}

export interface CategoryRequest {
  id: number;
  name: string;
}

export interface Model3DResponseDto {
  id: string;
  createdAt: string;
  updatedAt?: string;
  isOwner: boolean;
  ownerAvatar?: string;
  ownerName: string;
  name: string;
  visibility: string;
  file: Model3DFileResponseDto;
  description?: Record<string, any>;
  thumbnail?: string;
  categories?: CategoryResponse[];
}

export interface Model3DUpdateRequestDto {
  name?: string;
  visibility?: string;
  description?: object;
  categories?: CategoryRequest[];
}

/**
 * Organizations & Workspaces
 */
export const OrgMemberRole = {
  Owner: 'owner',
  Admin: 'admin',
  Editor: 'editor',
  Viewer: 'viewer',
} as const;
export type OrgMemberRole = (typeof OrgMemberRole)[keyof typeof OrgMemberRole];

export const WorkspaceMemberRole = {
  Editor: 'editor',
  Viewer: 'viewer',
} as const;
export type WorkspaceMemberRole = (typeof WorkspaceMemberRole)[keyof typeof WorkspaceMemberRole];

export const PlanType = {
  Starter: 'starter',
  Growth: 'growth',
  Enterprise: 'enterprise',
} as const;
export type PlanType = (typeof PlanType)[keyof typeof PlanType];

export const StorageBackend = {
  Local: 'local',
  S3: 's3',
} as const;
export type StorageBackend = (typeof StorageBackend)[keyof typeof StorageBackend];

export interface OrgSubscriptionSummaryDto {
  storageLimitBytes: string | null;
  seatsLimit: number | null;
  storageBackend: StorageBackend;
}

export interface OrgSubscriptionDetailDto {
  planType: PlanType;
  storageLimitBytes: string | null;
  seatsLimit: number | null;
  storageBackend: StorageBackend;
  storageUsedBytes: number;
}

export interface S3StorageConfigDto {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
}

export interface UpdateStorageConfigRequestDto {
  storageBackend: StorageBackend;
  s3Config?: S3StorageConfigDto;
}

export interface OrganizationResponseDto {
  id: string;
  name: string;
  slug: string;
  planType: PlanType;
  createdAt: string;
  subscription?: OrgSubscriptionSummaryDto;
}

export interface OrganizationCreateRequestDto {
  name: string;
  slug: string;
}

export interface OrganizationUpdateRequestDto {
  name?: string;
}

export interface OrgMemberResponseDto {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: OrgMemberRole;
  joinedAt: string;
}

export interface OrgInviteCreateRequestDto {
  email: string;
  role: OrgMemberRole;
}

export interface OrgMemberRoleChangeRequestDto {
  role: OrgMemberRole;
}

export interface OrgInviteAcceptRequestDto {
  token: string;
}

export interface WorkspaceResponseDto {
  id: string;
  name: string;
  orgId: string;
  memberCount: number;
  createdAt: string;
}

export interface WorkspaceCreateRequestDto {
  name: string;
  orgId: string;
}

export interface WorkspaceUpdateRequestDto {
  name?: string;
}

export interface WorkspaceMemberAddRequestDto {
  userId: string;
  role: WorkspaceMemberRole;
}

/**
 * Exceptions
 */
export interface HttpException {
  status: number;
  type?: string;
  message: string;
  error: string;
  data?: any;
}
export interface ValidationHttpException<Property = string> {
  status: 400;
  type: 'ValidationError';
  message: 'Ошибка валидации';
  error: 'Bad Request';
  data: { property: Property; errors: string[] }[];
}

/**
 * Embed
 */
export interface BrandingConfigDto {
  logoUrl?: string;
  primaryColor?: string;
  showBadge: boolean;
}

export interface EmbedProjectResponseDto {
  id: string;
  orgId: string;
  name: string;
  modelId: string | null;
  autoRotate: boolean;
  brandingConfig: BrandingConfigDto | null;
  allowedOrigins: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface EmbedProjectCreateRequestDto {
  orgId: string;
  name: string;
  modelId?: string;
  autoRotate?: boolean;
}

export interface EmbedProjectUpdateRequestDto {
  name?: string;
  modelId?: string | null;
  autoRotate?: boolean;
  brandingConfig?: BrandingConfigDto;
}

export interface EmbedViewerResponseDto {
  model: Model3DResponseDto;
  brandingConfig: BrandingConfigDto | null;
  autoRotate: boolean;
  allowedOrigins: string[];
}

export interface DailyViewDto {
  date: string;
  count: number;
}

export interface OriginViewDto {
  origin: string;
  count: number;
}

export interface ViewAnalyticsResponseDto {
  dailyViews: DailyViewDto[];
  topOrigins: OriginViewDto[];
  totalViews: number;
}

/**
 * Reviews & Annotations
 */
export interface CommentAuthorDto {
  id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface CommentResponseDto {
  id: string;
  body: string;
  pos: { x: number; y: number; z: number } | null;
  resolved: boolean;
  parentId: string | null;
  author: CommentAuthorDto;
  createdAt: string;
  updatedAt?: string;
}

export interface CommentCreateRequestDto {
  body: string;
  posX?: number;
  posY?: number;
  posZ?: number;
  parentId?: string;
}

export interface CommentUpdateRequestDto {
  body?: string;
  resolved?: boolean;
}

export interface AnnotationResponseDto {
  id: string;
  label: string;
  body?: string;
  pos: { x: number; y: number; z: number };
  cameraPos: { x: number; y: number; z: number } | null;
  order: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AnnotationCreateRequestDto {
  label: string;
  body?: string;
  posX: number;
  posY: number;
  posZ: number;
  cameraPosX?: number;
  cameraPosY?: number;
  cameraPosZ?: number;
  order?: number;
}

export interface AnnotationUpdateRequestDto {
  label?: string;
  body?: string;
  posX?: number;
  posY?: number;
  posZ?: number;
  cameraPosX?: number;
  cameraPosY?: number;
  cameraPosZ?: number;
  order?: number;
}

export interface AnnotationReorderRequestDto {
  ids: string[];
}

/**
 * Scenes
 */
export const SceneLightType = {
  Directional: 'directional',
  Point: 'point',
  Spot: 'spot',
} as const;
export type SceneLightType = (typeof SceneLightType)[keyof typeof SceneLightType];

export interface SceneCameraBookmarkDto {
  label: string;
  posX: number;
  posY: number;
  posZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
}

export interface SceneConfigDto {
  backgroundColor: string;
  ambientLightIntensity: number;
  environmentHdriPath?: string;
  cameraBookmarks: SceneCameraBookmarkDto[];
}

export interface SceneLightResponseDto {
  id: string;
  type: SceneLightType;
  posX: number;
  posY: number;
  posZ: number;
  color: string;
  intensity: number;
  castShadow: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SceneObjectModelFileDto {
  entryFile: string;
}

export interface SceneObjectModelDto {
  id: string;
  name: string;
  file: SceneObjectModelFileDto;
}

export interface SceneObjectResponseDto {
  id: string;
  posX: number;
  posY: number;
  posZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  order: number;
  model: SceneObjectModelDto;
  createdAt: string;
  updatedAt?: string;
  animationConfig?: Record<string, unknown> | null;
  audioConfig?: Record<string, unknown> | null;
}

export const SceneVisibility = {
  Public: 'public',
  Private: 'private',
  Unlisted: 'unlisted',
} as const;
export type SceneVisibilityType = (typeof SceneVisibility)[keyof typeof SceneVisibility];

export interface SceneResponseDto {
  id: string;
  name: string;
  description?: string;
  config: SceneConfigDto;
  thumbnailPath?: string;
  objects: SceneObjectResponseDto[];
  lights: SceneLightResponseDto[];
  workspaceId: string | null;
  userId: string | null;
  visibility: SceneVisibilityType;
  createdAt: string;
  updatedAt?: string;
}

export interface SceneListItemResponseDto {
  id: string;
  name: string;
  description?: string;
  thumbnailPath?: string;
  objectCount: number;
  workspaceId: string | null;
  userId: string | null;
  visibility: SceneVisibilityType;
  createdAt: string;
  updatedAt?: string;
}

export interface SceneCreateRequestDto {
  name: string;
  description?: string;
  workspaceId?: string;
}

export interface SceneUpdateRequestDto {
  name?: string;
  description?: string;
  config?: Partial<SceneConfigDto>;
  visibility?: SceneVisibilityType;
}

export interface SceneObjectAudioConfigDto {
  audioId: string;
  volume?: number;
  loop?: boolean;
  autoplay?: boolean;
  positional?: boolean;
  maxDistance?: number;
}

export interface SceneObjectUpsertDto {
  modelId: string;
  posX?: number;
  posY?: number;
  posZ?: number;
  rotX?: number;
  rotY?: number;
  rotZ?: number;
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  audioConfig?: SceneObjectAudioConfigDto | null;
  animationConfig?: Record<string, unknown> | null;
}

export interface SceneLightUpsertDto {
  type?: SceneLightType;
  posX?: number;
  posY?: number;
  posZ?: number;
  color?: string;
  intensity?: number;
  castShadow?: boolean;
}

/**
 * Model Versions
 */
export interface ModelVersionUploaderDto {
  id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface ModelVersionResponseDto {
  id: string;
  versionNumber: number;
  fileName: string;
  fileSize: number;
  entryFile?: string | null;
  changeNotes: string | null;
  isActive: boolean;
  uploader: ModelVersionUploaderDto;
  createdAt: string;
}

/**
 * Model Display Config
 */
export const ModelLightType = {
  Ambient: 'ambient',
  Directional: 'directional',
  Point: 'point',
  Spot: 'spot',
} as const;
export type ModelLightTypeValue = (typeof ModelLightType)[keyof typeof ModelLightType];

export interface ModelLightResponseDto {
  id: string;
  type: ModelLightTypeValue;
  posX: number;
  posY: number;
  posZ: number;
  color: string;
  intensity: number;
  castShadow: boolean;
  createdAt: string;
}

export interface DisplayConfigResponseDto {
  id: string;
  modelId: string;
  backgroundColor: string;
  ambientIntensity: number;
  environmentHdriPath?: string;
  fogEnabled: boolean;
  fogType: 'linear' | 'exp2';
  fogColor: string;
  fogNear: number;
  fogFar: number;
  postProcess?: Record<string, any> | null;
  rendererConfig?: Record<string, any> | null;
  lights: ModelLightResponseDto[];
}

export interface DisplayConfigUpdateDto {
  backgroundColor?: string;
  ambientIntensity?: number;
  fogEnabled?: boolean;
  fogType?: 'linear' | 'exp2';
  fogColor?: string;
  fogNear?: number;
  fogFar?: number;
  postProcess?: Record<string, any> | null;
  rendererConfig?: Record<string, any> | null;
}

export interface ModelLightUpsertDto {
  type: ModelLightTypeValue;
  posX?: number;
  posY?: number;
  posZ?: number;
  color?: string;
  intensity?: number;
  castShadow?: boolean;
}

export interface ModelLightUpdateDto {
  type?: ModelLightTypeValue;
  posX?: number;
  posY?: number;
  posZ?: number;
  color?: string;
  intensity?: number;
  castShadow?: boolean;
}

export interface MaterialOverrideResponseDto {
  id: string;
  modelId: string;
  meshName: string;
  colorHex?: string;
  metalness?: number;
  roughness?: number;
  emissiveHex?: string;
  emissiveIntensity?: number;
  opacity?: number;
  wireframe: boolean;
  textureMapUrl?: string;
  normalMapUrl?: string;
  roughnessMapUrl?: string;
  metalnessMapUrl?: string;
  emissiveMapUrl?: string;
  aoMapUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MaterialOverrideUpsertDto {
  colorHex?: string;
  metalness?: number;
  roughness?: number;
  emissiveHex?: string;
  emissiveIntensity?: number;
  opacity?: number;
  wireframe?: boolean;
}

export interface ModelAudioResponseDto {
  id: string;
  modelId: string;
  filename: string;
  originalName: string;
  durationS?: number | null;
  createdAt: string;
}


