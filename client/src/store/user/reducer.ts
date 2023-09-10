import { createSlice } from '@reduxjs/toolkit';
import { ThemeMode } from '../../layouts/components/ThemeSwitcher';

export interface UserState {
  theme: ThemeMode;
}

export const userSlice = createSlice({
  name: '@mesh_hub/user',
  initialState: {},
  reducers: {},
});
