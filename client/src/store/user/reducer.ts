import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { ThemeMode } from '@/layouts/components/ThemeSwitcher/model';

export interface UserState {
  theme: ThemeMode;
}

const initialState: UserState = {
  theme: 'system',
};

export const userSlice = createSlice({
  name: '@mesh_hub/user',
  initialState,
  reducers: {
    setTheme(state, { payload }: PayloadAction<ThemeMode>) {
      state.theme = payload;
    },
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
