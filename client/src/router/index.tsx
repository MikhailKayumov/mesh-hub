import { createBrowserRouter, Navigate, RouteObject } from 'react-router-dom';
import BaseErrorBoundary from '@/components/BaseErrorBoundary';
import BasePage from '@/pages/Base';
import MainPage from '@/pages/Main';
import RouterPaths from './paths';

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
        lazy: async () => ({ Component: (await import('@/pages/Auth')).default }),
        children: [
          {
            index: true,
            element: <Navigate replace to={RouterPaths.Login} />,
          },
          {
            path: RouterPaths.Login,
            lazy: async () => ({ Component: (await import('@/pages/Login')).default }),
          },
          {
            path: RouterPaths.Register,
            lazy: async () => ({ Component: (await import('@/pages/Register')).default }),
          },
          {
            path: RouterPaths.ResetPassword,
            lazy: async () => ({ Component: (await import('@/pages/ResetPassword')).default }),
          },
          {
            path: RouterPaths.NewPassword,
            lazy: async () => ({ Component: (await import('../pages/NewPassword')).default }),
          },
        ],
      },
      // user
      {
        path: RouterPaths.User,
        lazy: async () => ({ Component: (await import('@/pages/User')).default }),
        children: [
          {
            index: true,
            element: <Navigate replace to={RouterPaths.Models} />,
          },
          {
            path: RouterPaths.Models,
            lazy: async () => ({ Component: (await import('@/pages/Profile')).default }),
          },
          {
            path: RouterPaths.Profile,
            lazy: async () => ({ Component: (await import('@/pages/Profile')).default }),
          },
          {
            path: RouterPaths.Settings,
            lazy: async () => ({ Component: (await import('@/pages/Profile')).default }),
          },
        ],
      },
    ],
  },
  // {
  //   path: 'editor',
  //   lazy: () => import('@/pages/Editor'),
  // },
];

const router = createBrowserRouter(routes);

export default router;
