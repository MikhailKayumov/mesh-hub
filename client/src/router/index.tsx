import { createBrowserRouter, RouteObject } from 'react-router-dom';
import BasePage from '../pages';
import LoginPage from '../pages/login';
import RouterPaths from './paths';

const routes: RouteObject[] = [
  {
    path: RouterPaths.Base,
    element: <BasePage />,
    children: [
      {
        index: true,
        element: <h1>Main</h1>,
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
