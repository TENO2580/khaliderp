// In-memory cache for ultra-fast tab switching
const cache = new Map<string, any>();

export const getCachedData = (key: string) => {
  return cache.get(key);
};

export const setCachedData = (key: string, data: any) => {
  cache.set(key, data);
};

export const clearCache = (key?: string) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};
