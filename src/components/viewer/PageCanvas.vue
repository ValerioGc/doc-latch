<script setup lang="ts">

  import { computed, watch, onMounted, onUnmounted, useTemplateRef } from 'vue';
  import { usePageCanvas } from '@/composables/usePageCanvas';
  import { useDocumentStore } from '@/stores/document';
  import { enqueueRender } from '@/composables/useRenderQueue';

  const ZOOM_DEBOUNCE_MS = 200;

  const props = defineProps<{
    page: number
    tabId?: string
  }>();

  const docStore = useDocumentStore();
  const { isLoading, renderToCanvas } = usePageCanvas(props.tabId);

  const tab = computed(() => (props.tabId ? docStore.getTab(props.tabId) : null));
  const info = computed(() => (tab.value ? tab.value.info : docStore.info));
  const zoom = computed(() => (tab.value ? tab.value.zoom : docStore.zoom));

  const rootRef = useTemplateRef<HTMLElement>('root');
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let observer: IntersectionObserver | undefined;
  let isNearViewport = false;
  let mounted = false;

  const targetWidth = computed(() => (info.value?.pageWidthPt ?? 0) * zoom.value / 100);
  const targetHeight = computed(() => (info.value?.pageHeightPt ?? 0) * zoom.value / 100);

  async function render(): Promise<void> {
    if (!mounted)
      return;
    await renderToCanvas(props.page, zoom.value / 100);
  }

  watch(zoom, () => {
    isLoading.value = true;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      enqueueRender(render, isNearViewport ? 'high' : 'low');
    }, ZOOM_DEBOUNCE_MS);
  });

  onMounted(() => {
    mounted = true;

    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver((entries) => {
        isNearViewport = entries.some((e) => e.isIntersecting);
      }, { rootMargin: '400px' });
      observer.observe(rootRef.value!);
    }

    enqueueRender(render, 'low');
  });

  onUnmounted(() => {
    mounted = false;
    observer?.disconnect();
    clearTimeout(debounceTimer);
  });

</script>

<template>
  <div ref="root" class="page_canvas" :style="{ width: `${targetWidth}px`, height: `${targetHeight}px` }">
    <canvas ref="canvas"
      class="page_canvas_el"
      :class="{ 'page_canvas_el--stale': isLoading }"
      :aria-label="`Pagina ${page}`"
    ></canvas>
    <output v-if="isLoading" class="page_canvas_spinner"></output>
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
    overflow: hidden;
    transition: width $transition-fast, height $transition-fast;

    &_el {
      display: block;
      width: 100%;
      height: 100%;
      transition: filter $transition-fast;

      &--stale {
        filter: blur(2px);
        opacity: 0.7;
      }
    }

    &_spinner {
      display: block;
      width: 28px;
      height: 28px;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      border: 2px solid var(--color-border);
      border-top-color: var(--color-accent);
      border-radius: 50%;
      animation: page-canvas-spin 0.7s linear infinite;
    }
  }

  @keyframes page-canvas-spin {
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }

</style>
