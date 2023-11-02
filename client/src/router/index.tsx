import { createBrowserRouter, RouteObject } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import BasePage from '@/pages';
import LoginPage from '@/pages/Login';
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
      {
        path: RouterPaths.Login,
        element: <LoginPage />,
      },
    ],
  },
];

const router = createBrowserRouter(routes);

export default router;
