import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { BasePage } from '@/pages/Base';
import { ErrorPage } from '@/pages/Error';
import { MainPage } from '@/pages/Main';
import { RouterPaths } from '@/shared/router/paths.ts';
import { BaseErrorBoundary } from '@/widgets/BaseErrorBoundary';

const routes: RouteObject[] = [
  {
    path: RouterPaths.Base,
    element: <BasePage />,
    ErrorBoundary: BaseErrorBoundary,
    children: [
      {
        index: true,
        element: <MainPage />,
      },
      // auth
      {
        path: RouterPaths.Auth,
        lazy: async () => ({ Component: (await import('@/pages/Auth')).AuthPage }),
        children: [
          {
            index: true,
            element: <Navigate to={RouterPaths.Login} />,
          },
          {
            path: RouterPaths.Login,
            lazy: async () => ({ Component: (await import('@/pages/Auth/pages/Login')).LoginPage }),
          },
          {
            path: RouterPaths.Register,
            lazy: async () => ({ Component: (await import('@/pages/Auth/pages/Register')).RegisterPage }),
          },
          {
            path: RouterPaths.ResetPassword,
            lazy: async () => ({ Component: (await import('@/pages/Auth/pages/ResetPassword')).ResetPasswordPage }),
          },
          {
            path: RouterPaths.NewPassword,
            lazy: async () => ({ Component: (await import('@/pages/Auth/pages/NewPassword')).NewPasswordPage }),
          },
        ],
      },
      // user
      {
        path: RouterPaths.User,
        lazy: async () => ({ Component: (await import('@/pages/User')).UserPage }),
        children: [
          {
            index: true,
            element: <Navigate replace to={RouterPaths.Models} />,
          },
          {
            path: RouterPaths.Models,
            lazy: async () => ({ Component: (await import('@/pages/UserModels3D')).ModelsPage }),
          },
          {
            path: RouterPaths.Profile,
            lazy: async () => ({ Component: (await import('@/pages/User/pages/Profile')).ProfilePage }),
          },
          {
            path: RouterPaths.Settings,
            lazy: async () => ({ Component: (await import('@/pages/User/pages/Settings')).SettingsPage }),
          },
          {
            path: RouterPaths.DevSandbox,
            lazy: async () => ({ Component: (await import('@/pages/User/pages/DevSandbox')).DevSandbox }),
          },
          {
            path: RouterPaths.UserScenes,
            lazy: async () => ({ Component: (await import('@/pages/UserScenes')).UserScenesPage }),
          },
          {
            path: `${RouterPaths.UserScenes}/${RouterPaths.SceneId}`,
            lazy: async () => ({ Component: (await import('@/pages/SceneEditor')).SceneEditorPage }),
          },
        ],
      },
      // models
      {
        path: RouterPaths.Models,
        lazy: async () => ({ Component: (await import('@/pages/Models3D')).Models3DPage }),
        children: [
          {
            index: true,
            element: <Navigate replace to={RouterPaths.Base} />,
          },
          {
            path: RouterPaths.Id,
            lazy: async () => ({ Component: (await import('@/pages/Models3D/pages/Model3D')).Model3DPage }),
          },
        ],
      },
      // public scene
      {
        path: RouterPaths.PublicScene,
        lazy: async () => ({ Component: (await import('@/pages/PublicScene')).PublicScenePage }),
      },
      // organizations
      {
        path: RouterPaths.Org,
        children: [
          {
            path: RouterPaths.OrgCreate,
            lazy: async () => ({ Component: (await import('@/pages/OrgCreate')).OrgCreatePage }),
          },
          {
            path: RouterPaths.OrgId,
            lazy: async () => ({ Component: (await import('@/pages/OrgDashboard')).OrgDashboardPage }),
          },
          {
            path: `${RouterPaths.OrgId}/${RouterPaths.WorkspaceSeg}/${RouterPaths.WorkspaceId}`,
            lazy: async () => ({
              Component: (await import('@/pages/OrgDashboard/WorkspaceDashboard')).WorkspaceDashboardPage,
            }),
          },
          {
            path: `${RouterPaths.OrgId}/${RouterPaths.WorkspaceSeg}/${RouterPaths.WorkspaceId}/${RouterPaths.Scenes}`,
            lazy: async () => ({
              Component: (await import('@/pages/Scenes')).ScenesPage,
            }),
          },
          {
            path: `${RouterPaths.OrgId}/${RouterPaths.WorkspaceSeg}/${RouterPaths.WorkspaceId}/${RouterPaths.Scenes}/${RouterPaths.SceneId}`,
            lazy: async () => ({
              Component: (await import('@/pages/SceneEditor')).SceneEditorPage,
            }),
          },
          {
            path: `${RouterPaths.OrgId}/${RouterPaths.Embed}/${RouterPaths.EmbedProjectId}`,
            lazy: async () => ({
              Component: (await import('@/pages/EmbedProject')).EmbedProjectPage,
            }),
          },
        ],
      },
    ],
  },
  {
    path: RouterPaths.Editor,
    children: [
      {
        index: true,
        element: <Navigate replace to={RouterPaths.Base} />,
      },
      {
        path: RouterPaths.Id,
        lazy: async () => ({ Component: (await import('@/pages/Editor')).EditorPage }),
      },
    ],
  },
  {
    path: RouterPaths.Embed,
    children: [
      {
        path: RouterPaths.EmbedModelId,
        lazy: async () => ({ Component: (await import('@/pages/EmbedViewer')).EmbedViewerPage }),
      },
    ],
  },
  {
    path: ':code?/*',
    element: <ErrorPage />,
  },
];

export const router = createBrowserRouter(routes);
