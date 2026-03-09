import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import type { ThemeName } from '@/shared/theme/types.ts';
import type { WebStorage } from 'redux-persist/lib/types';

const storage: WebStorage = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => {
    localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    return Promise.resolve();
  },
};

export interface UserState {
  session: string | null;
  theme: ThemeName;
}

const initialState: UserState = {
  session: null,
  theme: 'deepblue',
};

export const userSlice = createSlice({
  name: '@mesh_hub/user',
  initialState,
  reducers: {
    setSession(state, { payload }: PayloadAction<UserState['session']>) {
      state.session = payload;
    },
    setTheme(state, { payload }: PayloadAction<UserState['theme']>) {
      state.theme = payload;
    },
    reset: () => initialState,
  },
});

export const userActions = userSlice.actions;

export const userReducer = persistReducer(
  {
    key: '@mesh_hub/user',
    storage,
  },
  userSlice.reducer,
);
