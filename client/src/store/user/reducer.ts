import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { ThemeName } from '@/theme/types.ts';

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
