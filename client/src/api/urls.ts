const ApiUrls = {
  // auth
  Register: 'auth/signup',
  Login: 'auth/login',
  Logout: 'auth/logout',
  Refresh: 'auth/refresh',
  CurrentUserSessions: 'auth/current-user-sessions',
  CloseCurrentUserSessions: 'auth/current-user-sessions',
  // user
  CurrentUser: 'user/current',
  UpdateCurrentUserAvatar: 'user/current/avatar',
  ResetPassword: 'user/reset-password',
  NewPassword: 'user/new-password',
  ChangePassword: 'user/change-password',
  // resources
  ResourcesCGSoft: 'resources/cg-soft/all',
  ResourcesCategories: 'resources/category/all',
  // models 3d
  Get3DModels: 'models-3d',
  Update3DModels: 'models-3d',
  SaveThumbnailBase64: 'save-thumbnail-base64',
  CurrentUser3DModels: 'models-3d/current-user',
  Upload3DModel: 'models-3d/upload',
} as const;

export type ApiUrl = keyof typeof ApiUrls;

export default ApiUrls;
