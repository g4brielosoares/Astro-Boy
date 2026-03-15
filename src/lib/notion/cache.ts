export type CacheEntry<T> = {
  value: T;
  tags: string[];
  updatedAt: number;
  maxAgeMs: number;
  stale: boolean;
  refreshing: boolean;
};

export type CacheSetOptions = {
  tags?: string[];
  maxAgeMs?: number;
};

export type CacheResolveOptions<T> = CacheSetOptions & {
  loader: () => Promise<T>;
};

const DEFAULT_MAX_AGE_MS = 50 * 60 * 1000;

const store = new Map<string, CacheEntry<unknown>>();
const tagIndex = new Map<string, Set<string>>();
const inflight = new Map<string, Promise<unknown>>();

function normalizeTags(tags: string[] = []) {
  return [...new Set(tags.filter(Boolean))];
}

function getTagSet(tag: string) {
  let set = tagIndex.get(tag);
  if (!set) {
    set = new Set<string>();
    tagIndex.set(tag, set);
  }
  return set;
}

function removeKeyFromIndexes(key: string, tags: string[]) {
  for (const tag of tags) {
    const set = tagIndex.get(tag);
    if (!set) continue;

    set.delete(key);

    if (set.size === 0) {
      tagIndex.delete(tag);
    }
  }
}

function addKeyToIndexes(key: string, tags: string[]) {
  for (const tag of tags) {
    getTagSet(tag).add(key);
  }
}

function isExpired(entry: CacheEntry<unknown>) {
  return Date.now() - entry.updatedAt >= entry.maxAgeMs;
}

function isStale(entry: CacheEntry<unknown>) {
  return entry.stale || isExpired(entry);
}

function startRefresh<T>(key: string, loader: () => Promise<T>, tags: string[], maxAgeMs: number) {
  const existing = inflight.get(key);
  if (existing) return existing;

  const current = store.get(key);
  if (current) current.refreshing = true;

  const task = loader()
    .then((freshValue) => {
      setCache(key, freshValue, { tags, maxAgeMs });
      return freshValue;
    })
    .catch((error) => {
      const staleEntry = store.get(key);
      if (staleEntry) staleEntry.refreshing = false;
      throw error;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, task);
  return task;
}

export function getCacheEntry<T>(key: string): CacheEntry<T> | null {
  const entry = store.get(key);
  return (entry as CacheEntry<T>) ?? null;
}

export function setCache<T>(key: string, value: T, options: CacheSetOptions = {}) {
  const tags = normalizeTags(options.tags);
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
  const current = store.get(key);

  if (current) {
    removeKeyFromIndexes(key, current.tags);
  }

  const next: CacheEntry<T> = {
    value,
    tags,
    updatedAt: Date.now(),
    maxAgeMs,
    stale: false,
    refreshing: false,
  };

  store.set(key, next);
  addKeyToIndexes(key, tags);

  return next;
}

export function deleteCache(key: string) {
  const current = store.get(key);
  if (!current) return;

  removeKeyFromIndexes(key, current.tags);
  inflight.delete(key);
  store.delete(key);
}

export function markStaleByKey(key: string) {
  const entry = store.get(key);
  if (!entry) return false;

  entry.stale = true;
  return true;
}

export function markStaleByTag(tag: string) {
  const keys = tagIndex.get(tag);
  if (!keys?.size) return 0;

  let count = 0;

  for (const key of keys) {
    const entry = store.get(key);
    if (!entry) continue;
    entry.stale = true;
    count += 1;
  }

  return count;
}

export function markStaleByTags(tags: string[]) {
  return normalizeTags(tags).reduce((count, tag) => count + markStaleByTag(tag), 0);
}

export async function resolveWithSWR<T>(key: string, options: CacheResolveOptions<T>): Promise<T> {
  const tags = normalizeTags(options.tags);
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
  const entry = getCacheEntry<T>(key);

  if (!entry) {
    const freshValue = await options.loader();
    setCache(key, freshValue, { tags, maxAgeMs });
    return freshValue;
  }

  if (isStale(entry) && !entry.refreshing) {
    void startRefresh(key, options.loader, tags, maxAgeMs);
  }

  return entry.value;
}

export function getDefaultMaxAgeMs() {
  return DEFAULT_MAX_AGE_MS;
}

export function __unsafe__debugSnapshot() {
  return {
    keys: [...store.keys()],
    tags: [...tagIndex.entries()].reduce<Record<string, string[]>>((acc, [tag, keys]) => {
      acc[tag] = [...keys];
      return acc;
    }, {}),
  };
}
