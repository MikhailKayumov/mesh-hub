export type RecentItem = {
  id: string;
  name: string;
  thumbnail?: string | null;
  updatedAt?: string;
};

export type RecentEntry = {
  models: RecentItem[];
  scenes: RecentItem[];
};

const MAX_ITEMS = 5;

const EMPTY: RecentEntry = { models: [], scenes: [] };

function storageKey(userId: string): string {
  return `@mesh_hub/recent:${userId}`;
}

export function getRecent(userId: string): RecentEntry {
  if (!userId) return { models: [], scenes: [] };
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { models: [], scenes: [] };
    const parsed = JSON.parse(raw) as Partial<RecentEntry> | null;
    return {
      models: Array.isArray(parsed?.models) ? parsed!.models.slice(0, MAX_ITEMS) : [],
      scenes: Array.isArray(parsed?.scenes) ? parsed!.scenes.slice(0, MAX_ITEMS) : [],
    };
  } catch {
    return { models: [], scenes: [] };
  }
}

export function pushRecent(userId: string, kind: 'model' | 'scene', item: RecentItem): void {
  if (!userId || !item?.id) return;
  try {
    const current = getRecent(userId);
    const listKey = kind === 'model' ? 'models' : 'scenes';
    const existing = current[listKey];
    const deduped = existing.filter((entry) => entry.id !== item.id);
    const next: RecentEntry = {
      ...current,
      [listKey]: [item, ...deduped].slice(0, MAX_ITEMS),
    };
    localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // localStorage unavailable / quota exceeded — ignore silently
  }
}

export function clearRecent(userId: string): void {
  if (!userId) return;
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
}

export const EMPTY_RECENT_ENTRY: RecentEntry = EMPTY;
