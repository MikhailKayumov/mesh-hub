import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/carousel/styles.css';
import 'mantine-datatable/styles.css';
import 'mantine-datatable/styles.layer.css';
import '@mantine/tiptap/styles.css';
import '@/theme/global.scss';

import { Notifications } from '@mantine/notifications';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';
import { router } from '@/router';
import { persist, store } from '@/store';
import { Theme } from '@/theme';
import '@/utils/date.ts';

export function App() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persist} loading={<>Loading</>}>
        <Theme>
          <RouterProvider router={router} />
          <Notifications limit={5} />
        </Theme>
      </PersistGate>
    </Provider>
  );
}
