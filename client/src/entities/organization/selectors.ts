import type { AppState } from '@/shared/types/store';

export const currentOrgIdSelector = (state: AppState) => state.org.currentOrgId;

export const currentWorkspaceIdSelector = (state: AppState) => state.org.currentWorkspaceId;
