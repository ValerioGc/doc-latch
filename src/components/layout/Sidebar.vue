<script setup lang="ts">

  import { useI18n } from 'vue-i18n';
  import { useDocumentStore } from '@/stores/document';
  import { useUiStore } from '@/stores/ui';
  import ThumbCanvas from '@/components/viewer/ThumbCanvas.vue';
  import chevronIcon from '@/assets/icons/chevron-left.svg?raw';

  const { t } = useI18n();
  const docStore = useDocumentStore();
  const uiStore = useUiStore();

  function onResizeStart(e: MouseEvent): void {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = uiStore.sidebarWidth;

    function onMove(ev: MouseEvent): void {
      uiStore.setSidebarWidth(startWidth + (ev.clientX - startX));
    }

    function onUp(): void {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

</script>

<template>
  <aside class="sidebar" aria-label="Miniature pagine">
    
    <div v-show="!uiStore.sidebarCollapsed"
      class="sidebar-inner"
      :style="{ width: `${uiStore.sidebarWidth}px` }"
    >

      <!-- PDF pages thumbnails -->
      <div v-for="page in docStore.totalPages" :key="`${docStore.filePath}-${page}`"
        class="thumb"
        :class="{ active: page === docStore.currentPage }"
        role="button"
        :aria-label="`Pagina ${page}`"
        :aria-current="page === docStore.currentPage ? 'page' : undefined"
        tabindex="0"
        @click="docStore.setPage(page)"
        @keydown.enter="docStore.setPage(page)"
      >
        <div class="thumb-preview">
          <ThumbCanvas :page="page" />
        </div>
        <span class="thumb-num">{{ page }}</span>
      </div>

      <!-- placeholder -->
      <div v-if="docStore.totalPages === 0" class="empty-sidebar" aria-hidden="true">
        <div class="thumb-placeholder-empty"> </div>
        <div class="thumb-placeholder-empty" style="opacity: 0.5"></div>
      </div>
    </div>

    <!-- Sidebar for toggle and resize -->
    <div class="sidebar-rail">
      <div class="sidebar-rail-top">
        <button :title="uiStore.sidebarCollapsed ? t('settings.expandSidebar') : t('settings.collapseSidebar')"
          class="sidebar-toggle"
          :class="{ collapsed: uiStore.sidebarCollapsed }"
          :aria-label="uiStore.sidebarCollapsed ? t('settings.expandSidebar') : t('settings.collapseSidebar')"
          @click="uiStore.toggleSidebar()"
        >
          <span class="sidebar-toggle-icon" aria-hidden="true" v-html="chevronIcon" />
        </button>
      </div>

      <div v-if="!uiStore.sidebarCollapsed" class="sidebar-resize"
        role="separator"
        aria-orientation="vertical"
        :aria-label="t('settings.resizeSidebar')"
        @mousedown="onResizeStart"
      ></div>
    </div>
  </aside>
</template>

<style lang="scss" scoped>

  .sidebar {
    display: flex;
    align-items: stretch;
    flex-shrink: 0;
    height: 100%;
  
    &-inner {
      @include scrollbar(8px);
      @include flex-col($space-2);

      align-items: center;
      padding: 10px $space-2;
      background: var(--color-bg-secondary);
      overflow-y: auto;
      overflow-x: hidden;
      flex-shrink: 0;
    }

    &-rail {
      @extend %flex-col;

      width: 14px;
      background: var(--color-bg-secondary);
      border-right: 0.5px solid var(--color-border);
      flex-shrink: 0;
      position: relative;

      &-top {
        @extend %flex-center;

        width: 100%;
        height: 26px;
        border-bottom: 0.5px solid var(--color-border);
        flex-shrink: 0;
      }
    }

    &-toggle {
      @extend %flex-center;

      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
      cursor: pointer;
      color: var(--color-text-tertiary);

      &-icon {
        display: flex;
      }

      :deep(svg) {
        width: 11px;
        height: 11px;
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

    &-resize {
      position: absolute;
      top: 0;
      right: -2px;
      width: 5px;
      height: 100%;
      cursor: col-resize;
      z-index: 1;
      &:hover {
        background: var(--color-accent);
        opacity: 0.3;
      }
    }
  }

  .thumb {
    @extend %flex-col;
    @extend %surface-primary;

    width: 104px;
    height: 130px;
    border-radius: $radius-sm;
    align-items: center;
    padding: 6px 6px 4px;
    cursor: pointer;
    flex-shrink: 0;
    transition: border-color $transition-fast;
    
    &:hover {
      border-color: var(--color-border-strong);
    }
    
    &.active {
      border-color: var(--color-accent);
    }
    
    &-preview {
      flex: 1;
      min-height: 0;
      width: 100%;
    }
    
    &-num {
      font-size: 10px;
      color: var(--color-text-tertiary);
      flex-shrink: 0;
    }

    &-placeholder-empty {
      width: 104px;
      height: 130px;
      background: var(--color-border);
      border-radius: $radius-sm;
    }
  }
    
  .empty-sidebar {
    @include flex-col($space-2);
    width: 100%;
    align-items: center;
  }

</style>