import { createBrowserRouter, Navigate, RouteObject } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import BasePage from '@/pages/Base';
import MainPage from '@/pages/Main';
import RouterPaths from './paths';

const routes: RouteObject[] = [
  {
    path: RouterPaths.Base,
    element: <BasePage />,
    errorElement: <ErrorBoundary />,
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
            path: RouterPaths.ChangePassword,
            lazy: async () => ({ Component: (await import('@/pages/ChangePassword')).default }),
          },
        ],
      },
      // user
      // {
      //   path: RouterPaths.Profile,
      //   element: <ProfilePage />,
      // },
    ],
  },
  // {
  //   path: 'editor',
  //   lazy: () => import('@/pages/Editor'),
  // },
];

const router = createBrowserRouter(routes);

export default router;
