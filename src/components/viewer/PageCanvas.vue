<script setup lang="ts">

  import { computed, watch, onMounted, onUnmounted } from 'vue';
  import { usePageCanvas } from '@/composables/usePageCanvas';
  import { useUiStore } from '@/stores/ui';
  import { useDocumentStore } from '@/stores/document';

  const ZOOM_DEBOUNCE_MS = 200;

  const props = defineProps<{
    page: number
  }>();

  const uiStore = useUiStore();
  const docStore = useDocumentStore();
  const { isLoading, renderToCanvas } = usePageCanvas();

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  // The box tracks the zoom level immediately (pure layout, no bitmap
  // involved), so the gap between pages stays correct even while the
  // re-render below is still pending.
  const targetWidth = computed(() => (docStore.info?.pageWidthPt ?? 0) * uiStore.zoom / 100);
  const targetHeight = computed(() => (docStore.info?.pageHeightPt ?? 0) * uiStore.zoom / 100);

  async function render(): Promise<void> {
    await renderToCanvas(props.page, uiStore.zoom / 100);
  }

  onMounted(render);

  // Re-render the page on zoom change. The stale canvas is hidden behind the
  // loading spinner for the duration instead of being CSS-scaled: scaling
  // blurred the bitmap and let it bleed visually over the gap between pages.
  watch(() => uiStore.zoom, () => {
    isLoading.value = true;

    if (debounceTimer)
      clearTimeout(debounceTimer);

    debounceTimer = setTimeout(render, ZOOM_DEBOUNCE_MS);
  });

  onUnmounted(() => {
    if (debounceTimer)
      clearTimeout(debounceTimer);
  });

</script>

<template>
  <div class="page_canvas" :style="{ width: `${targetWidth}px`, height: `${targetHeight}px` }">
    <output v-if="isLoading" class="page_canvas_spinner" aria-label="Caricamento pagina"></output>
    <canvas ref="canvas"
      class="page_canvas_el"
      :class="{ 'page_canvas_el--hidden': isLoading }"
      :aria-label="`Pagina ${page}`"
    ></canvas>
  </div>
</template>

<style lang="scss" scoped>

  .page_canvas {
    @extend %flex-center;
    @extend %surface-primary;

    border-radius: 2px;
    min-width: 200px;
    min-height: 260px;
    position: relative;
    transition: width $transition-fast, height $transition-fast;

    &_el {
      display: block;
      width: 100%;
      height: 100%;

      &--hidden {
        display: none;
      }
    }

    &_spinner {
      display: block;
      width: 28px;
      height: 28px;
      border: 2px solid var(--color-border);
      border-top-color: var(--color-accent);
      border-radius: 50%;
      animation: page-canvas-spin 0.7s linear infinite;
    }
  }

  @keyframes page-canvas-spin {
    to { transform: rotate(360deg); }
  }

</style>
