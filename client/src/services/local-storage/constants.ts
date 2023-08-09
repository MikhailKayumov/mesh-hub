export const LocalStorageKeys = {
  Theme: 'THEME',
} as const;

export type LocalStorageKey = (typeof LocalStorageKeys)[keyof typeof LocalStorageKeys];
