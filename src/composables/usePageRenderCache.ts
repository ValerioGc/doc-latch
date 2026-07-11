import type { PageRenderResult } from '@/types/pdf';

// Keeps rendered bitmaps per tab+page+zoom in memory
const cache = new Map<string, PageRenderResult>();

function cacheKey(tabId: string, page: number, zoom: number): string {
  return `${tabId}:${page}:${zoom}`;
}

export function getCachedPage(tabId: string, page: number, zoom: number): PageRenderResult | null {
  return cache.get(cacheKey(tabId, page, zoom)) ?? null;
}

export function setCachedPage(tabId: string, page: number, zoom: number, result: PageRenderResult): void {
  cache.set(cacheKey(tabId, page, zoom), result);
}

/** Drops all cached pages for a closed tab */
export function clearPageCache(tabId: string): void {
  const prefix = `${tabId}:`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix))
      cache.delete(key);
  }
}
