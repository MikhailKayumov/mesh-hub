import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import router from './router';
import { persist, store } from './store';

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<>Loading</>} persistor={persist}>
        <RouterProvider router={router} />
      </PersistGate>
    </Provider>
  );
}
