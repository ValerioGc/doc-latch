<script setup lang="ts">

  import { nextTick, ref, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useDocumentStore } from '@/stores/document';
  import { useUiStore } from '@/stores/ui';

  import ThumbCanvas from '@/components/viewer/ThumbCanvas.vue';
  import chevronIcon from '@/assets/icons/chevron-left.svg?raw';

  const { t } = useI18n();
  const docStore = useDocumentStore();
  const uiStore = useUiStore();

  const thumbRefs = ref<HTMLButtonElement[]>([]);

  watch(() => docStore.currentPage, async (page) => {
    await nextTick();
    thumbRefs.value[page - 1]?.scrollIntoView?.({ block: 'nearest' });
  });

  function onResizeStart(e: MouseEvent): void {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = uiStore.sidebarWidth;

    function onMove(ev: MouseEvent): void {
      uiStore.setSidebarWidth(startWidth + (ev.clientX - startX));
    }

    function onUp(): void {
      globalThis.removeEventListener('mousemove', onMove);
      globalThis.removeEventListener('mouseup', onUp);
    }

    globalThis.addEventListener('mousemove', onMove);
    globalThis.addEventListener('mouseup', onUp);
  }

</script>

<template>
  <aside class="sidebar" aria-label="Miniature pagine">

    <div class="sidebar_content">

      <!-- Toggle row -->
      <div class="sidebar_top">
        <button :title="uiStore.sidebarCollapsed ? t('settings.expandSidebar') : t('settings.collapseSidebar')"
          class="sidebar_toggle"
          :class="{ collapsed: uiStore.sidebarCollapsed }"
          :aria-label="uiStore.sidebarCollapsed ? t('settings.expandSidebar') : t('settings.collapseSidebar')"
          @click="uiStore.toggleSidebar()"
        >
          <span class="sidebar_toggle_icon" aria-hidden="true" v-html="chevronIcon" />
        </button>
      </div>

      <div v-show="!uiStore.sidebarCollapsed"
        class="sidebar_inner"
        :style="{ width: `${uiStore.sidebarWidth}px` }"
      >

        <!-- PDF pages thumbnails -->
        <button v-for="page in docStore.totalPages" :key="`${docStore.filePath}-${page}`"
          ref="thumbRefs"
          type="button"
          class="thumb"
          :class="{ active: page === docStore.currentPage }"
          :aria-label="`Pagina ${page}`"
          :aria-current="page === docStore.currentPage ? 'page' : undefined"
          @click="docStore.setPage(page)"
        >
          <div class="thumb_preview">
            <ThumbCanvas :page="page" />
          </div>
          <span class="thumb_num">{{ page }}</span>
        </button>

        <!-- placeholder -->
        <div v-if="docStore.totalPages === 0" class="empty_sidebar" aria-hidden="true">
          <div class="thumb_placeholder_empty"> </div>
          <div class="thumb_placeholder_empty" style="opacity: 0.5"></div>
        </div>
      </div>
    </div>

    <!-- Resize handle -->
    <hr v-if="!uiStore.sidebarCollapsed" class="sidebar_resize"
      aria-orientation="vertical"
      :aria-label="t('settings.resizeSidebar')"
      @mousedown="onResizeStart"
    />
  </aside>
</template>

<style lang="scss" scoped>

  .sidebar {
    display: flex;
    align-items: stretch;
    flex-shrink: 0;
    height: 100%;
    border-right: 0.5px solid var(--color-border);

    &_content {
      @extend %flex-col;

      flex-shrink: 0;
      background: var(--color-bg-secondary);
    }

    &_top {
      @extend %flex-center;

      height: 32px;
      border-bottom: 0.5px solid var(--color-border);
      flex-shrink: 0;
    }

    &_inner {
      @include scrollbar(8px);
      @include flex-col($space-2);

      align-items: center;
      padding: 10px $space-2;
      overflow-y: auto;
      overflow-x: hidden;
      flex: 1;
      min-height: 0;
    }

    &_resize {
      width: 5px;
      flex-shrink: 0;
      border: none;
      margin: 0;
      cursor: col-resize;

      &:hover {
        background: var(--color-accent);
        opacity: 0.3;
      }
    }
  }

  .sidebar_toggle {
    @extend %flex-center;

    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: $radius-sm;
    cursor: pointer;
    color: var(--color-text-tertiary);

    &_icon {
      display: flex;
    }

    :deep(svg) {
      width: 14px;
      height: 14px;
      transition: transform $transition-base;
    }

    &.collapsed :deep(svg) {
      transform: rotate(180deg);
    }

    &:hover {
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
    }
  }

  .thumb {
    @extend %flex-col;
    @extend %surface-primary;

    width: 100%;
    max-width: 150px;
    aspect-ratio: 4 / 5;
    border-radius: $radius-sm;
    align-items: center;
    padding: 6px 6px 4px;
    cursor: pointer;
    flex-shrink: 0;
    font: inherit;
    color: inherit;
    text-align: inherit;
    transition: border-color $transition-fast;
    
    &:hover {
      border-color: var(--color-border-strong);
    }
    
    &.active {
      border-color: var(--color-accent);
    }
    
    &_preview {
      flex: 1;
      min-height: 0;
      width: 100%;
    }

    &_num {
      font-size: 10px;
      color: var(--color-text-tertiary);
      flex-shrink: 0;
    }

    &_placeholder_empty {
      width: 100%;
      max-width: 150px;
      aspect-ratio: 4 / 5;
      background: var(--color-border);
      border-radius: $radius-sm;
    }
  }

  .empty_sidebar {
    @include flex-col($space-2);
    width: 100%;
    align-items: center;
  }

</style>