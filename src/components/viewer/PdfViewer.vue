<script setup lang="ts">

  import { computed, watch, nextTick, useTemplateRef, onUnmounted } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useDocumentStore } from '@/stores/document';
  import { useWheelGesture } from '@/composables/useWheelGesture';

  import PasswordDialog from '@/components/dialogs/password/PasswordDialog.vue';
  import HomeScreen from '@/components/viewer/HomeScreen.vue';
  import PageCanvas from '@/components/viewer/PageCanvas.vue';
  import errorIcon from '@/assets/icons/error.svg?raw';

  const { t } = useI18n();
  const docStore = useDocumentStore();

  const viewerRef = useTemplateRef<HTMLElement>('viewer');

  let programmaticPage = false;
  let programmaticTimer: ReturnType<typeof setTimeout> | null = null;
  let suppressScrollWatch = false;
  let rafId: number | null = null;

  // Scroll to current page when changed from outside (sidebar, keyboard, selector).
  watch(() => docStore.currentPage, async (page) => {
    if (suppressScrollWatch) {
      suppressScrollWatch = false;
      return;
    }
    await nextTick();
    programmaticPage = true;
    if (programmaticTimer !== null)
      clearTimeout(programmaticTimer);
    viewerRef.value
      ?.querySelector(`[data-page="${page}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    programmaticTimer = setTimeout(() => { programmaticPage = false; }, 800);
  });

  // After zoom change, re-sync the page number from the new scroll/size layout.
  watch(() => docStore.zoom, async () => {
    if (programmaticPage) return;
    await nextTick();
    syncPageFromScroll();
  });

  // Find the page whose top is nearest to (and at or above) the viewport midpoint.
  function syncPageFromScroll(): void {
    if (programmaticPage || !viewerRef.value) return;

    const viewerEl = viewerRef.value;
    const midpoint = viewerEl.getBoundingClientRect().top + viewerEl.clientHeight / 2;
    let page = docStore.currentPage;

    viewerEl.querySelectorAll<HTMLElement>('[data-page]').forEach((slot) => {
      if (slot.getBoundingClientRect().top <= midpoint)
        page = Number(slot.dataset.page);
    });

    if (page !== docStore.currentPage) {
      suppressScrollWatch = true;
      docStore.setPage(page);
    }
  }

  function onScroll(): void {
    if (programmaticPage) return;
    if (rafId !== null)
      cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(syncPageFromScroll);
  }

  onUnmounted(() => {
    if (rafId !== null)
      cancelAnimationFrame(rafId);
    if (programmaticTimer !== null)
      clearTimeout(programmaticTimer);
  });

  const { onWheel } = useWheelGesture(viewerRef, (delta) => docStore.adjustZoom(delta));

  function onMouseEnter(): void {
    docStore.setFocusedPane('left');
  }

  // Map PDF loading error kinds to i18n keys for user-friendly messages
  const errorMessage = computed(() => {
    const kind = docStore.error?.kind ?? 'Unknown';
    const key = kind.charAt(0).toLowerCase() + kind.slice(1);
    return t(`errors.${key}`);
  });

</script>

<template>
  <main ref="viewer" class="viewer" :class="{ 'viewer--split': docStore.splitEnabled }" role="main" @mouseenter="onMouseEnter" @wheel="onWheel" @scroll="onScroll">

    <!-- Empty state -->
    <HomeScreen v-if="docStore.state === 'idle'" />

    <!-- Loading state -->
    <div v-else-if="docStore.state === 'loading'" class="empty_state">
      <output class="spinner" aria-label="Caricamento"></output>
    </div>

    <!-- Password required -->
    <PasswordDialog v-if="docStore.state === 'password-required'" />

    <!-- Error state -->
    <div v-else-if="docStore.state === 'error'" class="empty_state error">
      <span class="empty_state_icon" aria-hidden="true" v-html="errorIcon" />
      <p class="empty_state_title">{{ errorMessage }}</p>
    </div>

    <!-- Document page list -->
    <div v-else-if="docStore.state === 'ready'" class="page_list">
      <div v-for="page in docStore.totalPages"
        :key="`${docStore.filePath}-${page}`"
        class="page_slot"
        :class="{ active: page === docStore.currentPage }"
        :data-page="page"
      >
        <PageCanvas :page="page" />
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>

  .viewer {
    @extend %flex-col;
    @include scrollbar;

    flex: 1;
    min-width: 0;
    background: var(--color-bg-tertiary);
    overflow-y: auto;
    align-items: center;

    &--split {
      border-right: 0.5px solid var(--color-border);
    }
  }

  .empty_state {
    @include flex-col($space-3);

    flex: 1;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);

    &.error {
      color: var(--color-accent);
    }

    &_icon {
      display: flex;

      :deep(svg) {
        width: 40px;
        height: 40px;
      }
    }

    &_title {
      font-size: $font-size-lg;
      font-weight: 500;
      color: var(--color-text-secondary);
    }
  }

  .spinner {
    display: block;
    width: 28px;
    height: 28px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .page_list {
    @include flex-col($space-6);
    align-items: center;
    padding: $space-5 $space-4;
    width: 100%;
  }

</style>