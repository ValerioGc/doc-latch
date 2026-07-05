import { ref, useTemplateRef } from 'vue';
import { usePdf } from '@/composables/usePdf';
import { useDocumentStore } from '@/stores/document';
import { getCachedPage, setCachedPage } from '@/composables/usePageRenderCache';
import type { PageRenderResult } from '@/types/pdf';

/**
 * Shared canvas-drawing logic for PageCanvas/ThumbCanvas.
 * @param tabId - renders the given tab instead of the active one (used by the split pane)
 */
export function usePageCanvas(tabId?: string) {
  const docStore = useDocumentStore();
  const { renderPage, renderPageFor } = usePdf();
  const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas');
  const isLoading = ref(true);

  // Incremented on every render request; guards against stale results painting
  // over a canvas that has already started a newer render.
  let renderSeq = 0;

  /**
   * @param page - 1-based page number
   * @param zoom - zoom factor (1.0 = 100%)
   */
  async function renderToCanvas(page: number, zoom: number): Promise<void> {
    const seq = ++renderSeq;

    const resolvedTabId = tabId ?? docStore.activeTabId;
    const cached = resolvedTabId ? getCachedPage(resolvedTabId, page, zoom) : null;

    let result: PageRenderResult | null;
    if (cached) {
      result = cached;
    } else {
      result = tabId ? await renderPageFor(tabId, page - 1, zoom) : await renderPage(page - 1, zoom);
      if (result && resolvedTabId)
        setCachedPage(resolvedTabId, page, zoom, result);
    }

    // A newer render was requested while this one was in flight — discard result.
    if (seq !== renderSeq)
      return;

    const canvas = canvasRef.value;
    if (!result || !canvas) {
      isLoading.value = false;
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      isLoading.value = false;
      return;
    }

    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (seq !== renderSeq) { resolve(); return; }
        canvas.width = result.widthPx;
        canvas.height = result.heightPx;
        ctx.drawImage(img, 0, 0);
        isLoading.value = false;
        resolve();
      };
      img.src = `data:image/png;base64,${result.imageBase64}`;
    });
  }

  return { canvasRef, isLoading, renderToCanvas };
}
