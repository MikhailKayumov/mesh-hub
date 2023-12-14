import { AppState } from '@/store';

export const sessionSelector = (state: AppState) => state.user.session;

export const themeSelector = (state: AppState) => state.user.theme;
