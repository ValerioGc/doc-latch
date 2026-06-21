<script setup lang="ts">

  import { ref, watch, onMounted, onUnmounted } from 'vue';
  import { usePageCanvas } from '@/composables/usePageCanvas';
  import { useUiStore } from '@/stores/ui';

  const ZOOM_DEBOUNCE_MS = 200;

  const props = defineProps<{
    page: number
  }>();

  const uiStore = useUiStore();
  const { isLoading, renderToCanvas } = usePageCanvas();

  const previewScale = ref(1);
  let renderedZoom = uiStore.zoom;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  async function render(): Promise<void> {
    const targetZoom = uiStore.zoom;
    await renderToCanvas(props.page, targetZoom / 100);
    renderedZoom = targetZoom;
    previewScale.value = 1;
  }

  onMounted(render);

  // Re-render page on zoom change
  watch(() => uiStore.zoom, (zoom) => {
    if (!isLoading.value)
      previewScale.value = zoom / renderedZoom;

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
  <div class="page_canvas">
    <div v-if="isLoading" class="page_canvas_spinner" aria-label="Caricamento pagina" role="status" />
    <canvas ref="canvas"
      class="page_canvas_el"
      :class="{ 'page_canvas_el--hidden': isLoading }"
      :style="{ transform: `scale(${previewScale})` }"
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

    &_el {
      display: block;
      max-width: 100%;
      transform-origin: center;

      &--hidden {
        display: none;
      }
    }

    &_spinner {
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
