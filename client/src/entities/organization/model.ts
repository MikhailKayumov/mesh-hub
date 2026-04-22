import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
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

export interface OrgState {
  currentOrgId: string | null;
  currentWorkspaceId: string | null;
}

const initialState: OrgState = {
  currentOrgId: null,
  currentWorkspaceId: null,
};

export const orgSlice = createSlice({
  name: '@mesh_hub/org',
  initialState,
  reducers: {
    setCurrentOrg(state, { payload }: PayloadAction<string | null>) {
      state.currentOrgId = payload;
      state.currentWorkspaceId = null;
    },
    setCurrentWorkspace(state, { payload }: PayloadAction<string | null>) {
      state.currentWorkspaceId = payload;
    },
    clearOrg: () => initialState,
  },
});

export const orgActions = orgSlice.actions;

export const orgReducer = persistReducer(
  {
    key: '@mesh_hub/org',
    storage,
  },
  orgSlice.reducer,
);
