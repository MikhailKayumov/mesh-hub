import { AppState } from '@/store';

export const sessionSelector = (state: AppState) => state.user.session;
