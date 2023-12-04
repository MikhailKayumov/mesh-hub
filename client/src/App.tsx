import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/carousel/styles.css';
import '@/theme/global.scss';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';
import router from '@/router';
import { persist, store } from '@/store';
import theme from '@/theme';

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persist} loading={<>Loading</>}>
        <MantineProvider defaultColorScheme="dark" theme={theme}>
          <RouterProvider router={router} />
          <Notifications limit={5} />
        </MantineProvider>
      </PersistGate>
    </Provider>
  );
}
