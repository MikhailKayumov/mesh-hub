import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, persistStore } from 'redux-persist';
import { Api } from '@/api/base';
import { rtkErrorLogger } from '@/api/utils';
import { userReducer } from '@/store/user/reducer.ts';

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

export type AppState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
