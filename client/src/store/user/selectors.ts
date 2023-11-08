import { AppState } from '@/store';

export const userThemeSelector = (state: AppState) => state.user.theme;
