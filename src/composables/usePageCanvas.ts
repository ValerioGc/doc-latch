import { ref, useTemplateRef } from 'vue';
import { usePdf } from '@/composables/usePdf';

/**
 * Shared canvas-drawing logic for PageCanvas/ThumbCanvas
 */
export function usePageCanvas() {
  const { renderPage } = usePdf();
  const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas');
  const isLoading = ref(true);

  /**
   * @param page - 1-based page number
   * @param zoom - zoom factor (1.0 = 100%)
   */
  async function renderToCanvas(page: number, zoom: number): Promise<void> {
    const result = await renderPage(page - 1, zoom);
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
