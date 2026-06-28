import type { PageRenderResult } from '@/types/pdf';

// Keeps rendered bitmaps per tab+page+zoom in memory. Reused on tab switches
// (the canvas gets recreated, but the page doesn't need to be re-rendered by
// the backend) and discarded once the tab closes. Zoom is part of the key
// (not just metadata to compare) so the full-page view and the sidebar
// thumbnails — which render the same pages at a different fixed zoom — never
// evict each other's entry.
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

/** Drops all cached pages for a closed tab. */
export function clearPageCache(tabId: string): void {
  const prefix = `${tabId}:`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix))
      cache.delete(key);
  }
}
