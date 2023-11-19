import { createBrowserRouter, RouteObject } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import BasePage from '@/pages';
import LoginPage from '@/pages/Login';
import ProfilePage from '@/pages/Profile';
import UiKitPage from '@/pages/UiKit';
import UiKitButtonsPage from '@/pages/UiKit/pages/Buttons';
import UiKitTypographyPage from '@/pages/UiKit/pages/Typography';
import MainPage from '../pages/Main';
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
      // user
      {
        path: RouterPaths.Profile,
        element: <ProfilePage />,
      },
      // auth
      {
        path: RouterPaths.Login,
        element: <LoginPage />,
      },
      // ui-kit
      {
        path: RouterPaths.UiKit,
        element: <UiKitPage />,
        children: [
          {
            path: RouterPaths.UiKitButtons,
            element: <UiKitButtonsPage />,
          },
          {
            path: RouterPaths.UiKitTypography,
            element: <UiKitTypographyPage />,
          },
        ],
      },
    ],
  },
  {
    path: 'editor',
    // element: <EditorPage />,
    lazy: () => import('@/pages/Editor'),
  },
];

const router = createBrowserRouter(routes);

export default router;
