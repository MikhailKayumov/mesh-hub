import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, persistStore } from 'redux-persist';
import { userReducer } from '@/entities/user/store';
import { Api } from '../api/base';
import { rtkErrorLogger } from '../api/utils';

export const store = configureStore({
  reducer: {
    [Api.reducerPath]: Api.reducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) => {
    const defaultMiddleware = getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    });

    return defaultMiddleware.concat(rtkErrorLogger, Api.middleware);
  },
  devTools: import.meta.env.DEV,
});

setupListeners(store.dispatch);

export const persist = persistStore(store);
