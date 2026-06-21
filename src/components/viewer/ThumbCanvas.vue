<script setup lang="ts">

  import { onMounted, onUnmounted, useTemplateRef } from 'vue';
  import { usePageCanvas } from '@/composables/usePageCanvas';

  const THUMB_ZOOM = 0.18;

  const props = defineProps<{
    page: number
  }>();

  const { isLoading, renderToCanvas } = usePageCanvas();
  const rootRef = useTemplateRef<HTMLElement>('root');

  const placeholderLines = ['50%', '', '70%', '', '40%'];

  let observer: IntersectionObserver | undefined;
  let rendered = false;

  function render(): void {
    if (rendered)
      return;

    rendered = true;
    void renderToCanvas(props.page, THUMB_ZOOM);
  }

  // Only render thumbnails once scrolled near the viewport
  onMounted(() => {
    const root = rootRef.value;
    if (!root)
      return;

    observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting))
        render();
    }, { root: root.closest('.sidebar'), rootMargin: '200px' });

    observer.observe(root);
  });

  onUnmounted(() => observer?.disconnect());

</script>

<template>
  <div ref="root" class="thumb_canvas">

    <!-- Placeholder skeleton while thumbnail is loading -->
    <div v-if="isLoading" class="thumb_canvas_placeholder" aria-hidden="true">
      <div class="thumb_canvas_line" 
          v-for="(line,index) in placeholderLines" :key="index" 
          :style="{ width: line }">
      </div>
    </div>

    <!-- Canvas element for thumbnail -->
    <canvas ref="canvas"
      class="thumb_canvas_el"
      :class="{ 'thumb_canvas_el--hidden': isLoading }"
      :aria-label="`Anteprima pagina ${page}`"
    ></canvas>
  </div>
</template>

<style lang="scss" scoped>

  .thumb_canvas {
    @extend %flex-center;

    width: 100%;
    height: 100%;
    overflow: hidden;
  
    &_placeholder {
      @include flex-col(5px);

      width: 68%;
    }

    &_line {
      height: 3px;
      background: var(--color-border-strong);
      border-radius: 2px;
      width: 100%;
    }

    &_el {
      display: block;
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;

      &--hidden {
        display: none;
      }
    }
  }

</style>
