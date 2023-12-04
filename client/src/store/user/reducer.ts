import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { SessionResponseDto } from '@/api/dto.ts';

export interface UserState {
  session: SessionResponseDto | null;
}

const initialState: UserState = {
  session: null,
};

export const userSlice = createSlice({
  name: '@mesh_hub/user',
  initialState,
  reducers: {
    setSession(state, { payload }: PayloadAction<UserState['session']>) {
      state.session = payload;
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
