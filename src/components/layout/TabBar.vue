<script setup lang="ts">

  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useDocumentStore } from '@/stores/document';
  import { useUiStore } from '@/stores/ui';
  import { startTabDrag, useDragState } from '@/composables/useTabDrag';

  import SplitToggle from '@/components/layout/SplitToggle.vue';
  import documentIcon from '@/assets/icons/document.svg?raw';
  import closeIcon from '@/assets/icons/window-close.svg?raw';
  import addIcon from '@/assets/icons/zoom-in.svg?raw';

  const { t } = useI18n();
  const docStore = useDocumentStore();
  const uiStore = useUiStore();
  const drag = useDragState();

  const visibleTabs = computed(() => docStore.tabs.filter((tab) => tab.id !== docStore.splitTabId));

  function onPointerDown(tabId: string, filePath: string | null, e: PointerEvent): void {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startTabDrag(tabId, tabName(filePath), e);
  }

  function tabName(filePath: string | null): string {
    if (!filePath)
      return t('menu.newTab');

    return filePath.split(/[\\/]/).pop() ?? filePath;
  }

</script>

<template>
  <div class="tab" role="tablist">
    <div v-for="tab in visibleTabs" :key="tab.id"
      class="tab_row"
      :data-tab-id="tab.id"
      :class="{
        'active': tab.id === docStore.activeTabId,
        'drop-over': drag.isDragging && drag.overTabId === tab.id,
      }"
    >

      <!-- Tab select button -->
      <button class="tab_select"
        role="tab"
        :aria-selected="tab.id === docStore.activeTabId"
        :title="tab.filePath ?? t('menu.newTab')"
        @click="docStore.setActiveTab(tab.id)"
      >
        <span class="tab_select_drag"
          data-drag-handle="true"
          @pointerdown="onPointerDown(tab.id, tab.filePath, $event)"
        >
          <span class="tab_select_icon" aria-hidden="true" v-html="documentIcon"></span>
          <span class="tab_select_name">{{ tabName(tab.filePath) }}</span>
        </span>
      </button>

      <!-- Close button -->
      <button class="tab_close"
        :title="t('menu.closeTab')"
        :aria-label="t('menu.closeTab')"
        @click="docStore.closeTab(tab.id)"
      >
        <span class="tab_close_icon" aria-hidden="true" v-html="closeIcon"></span>
      </button>
    </div>
    
    <!-- Split toggle button -->
    <SplitToggle v-if="!uiStore.isMobile" />

    <!-- New tab button -->
    <button v-if="!uiStore.isMobile" class="tab_add"
      :title="t('menu.newTab')"
      :aria-label="t('menu.newTab')"
      @click="docStore.newTab()"
    >
      <span class="tab_add_icon" aria-hidden="true" v-html="addIcon"></span>
    </button>

    <!-- Drag ghost teleported to body -->
    <Teleport to="body">
      <div v-if="drag.isDragging" class="tab_drag_ghost" aria-hidden="true"
        :style="{ left: `${drag.x + 14}px`, top: `${drag.y + 14}px` }"
      >
        <span class="tab_drag_ghost_icon" v-html="documentIcon"></span>
        <span class="tab_drag_ghost_label">{{ drag.label }}</span>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>

  .tab {
    @include flex-row;
    @include scrollbar(6px);

    flex: 1;
    min-width: 0;
    background: var(--color-bg-secondary);
    border-bottom: 0.5px solid var(--color-border);
    overflow-x: auto;
    overflow-y: hidden;
    flex-shrink: 0;
    padding: 5px $space-1 0;
    align-items: flex-end;
    gap: 2px;

    // ****** Context-dependent overrides *******
    &_row.active &_select{
      color: var(--color-text-primary); 
    }

    &_row.active &_select_icon { 
      color: var(--color-accent); 
    }

    &_row.active &_close,
    &_row:hover &_close{
      opacity: 1; 
      pointer-events: auto; 
    }

    &_row {
      @include flex-row;

      position: relative;
      flex-shrink: 0;
      max-width: 200px;
      height: 34px;
      border-radius: $radius-md $radius-md 0 0;
      border: 0.5px solid transparent;
      border-bottom: none;
      transition: background $transition-fast, border-color $transition-fast;

      &:hover:not(.active) {
        background: var(--color-bg-tertiary);
        border-color: var(--color-border);
      }

      &.active {
        background: var(--color-bg-primary);
        border-color: var(--color-border);
        z-index: 1;
      }

      &.drop-over {
        box-shadow: inset 0 0 0 1.5px var(--color-accent);
        background: color-mix(in srgb, var(--color-accent) 8%, var(--color-bg-primary));
      }
    }

    &_select {
      @include flex-row($space-2);

      flex: 1;
      min-width: 0;
      height: 100%;
      padding: 0 $space-2 0 $space-3;
      font-size: $font-size-sm;
      color: var(--color-text-secondary);
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: color $transition-fast;

      &_drag {
        @include flex-row($space-2);

        min-width: 0;
        flex: 1;
        cursor: grab;
        user-select: none;

        &:active {
          cursor: grabbing;
        }
      }

      &_icon {
        display: flex;
        flex-shrink: 0;
        color: var(--color-text-tertiary);
        transition: color $transition-fast;

        :deep(svg) {
          width: 13px;
          height: 13px;
        }
      }

      &_name {
        @extend %truncate;

        font-size: $font-size-xs;
      }
    }

    &_close {
      @extend %flex-center;

      width: 20px;
      height: 20px;
      align-self: center;
      flex-shrink: 0;
      margin-right: $space-1;
      border: none;
      background: transparent;
      border-radius: $radius-sm;
      color: var(--color-text-tertiary);
      cursor: pointer;
      opacity: 0;
      pointer-events: none;
      transition: opacity $transition-fast, background $transition-fast, color $transition-fast;

      &:hover {
        background: color-mix(in srgb, var(--color-accent) 12%, var(--color-bg-tertiary));
        color: var(--color-accent);
      }

      &_icon {
        display: flex;

        :deep(svg) {
          width: 11px;
          height: 11px;
        }
      }
    }

    &_add {
      @extend %flex-center;

      width: 26px;
      height: 30px;
      align-self: flex-end;
      margin-bottom: 2px;
      flex-shrink: 0;
      margin-left: $space-1;
      border: none;
      background: transparent;
      border-radius: $radius-sm;
      color: var(--color-text-tertiary);
      cursor: pointer;

      &:hover {
        background: var(--color-bg-tertiary);
        color: var(--color-text-primary);
      }

      &_icon {
        display: flex;

        :deep(svg) {
          width: 11px;
          height: 11px;
        }
      }
    }

    &_drag_ghost {
      position: fixed;
      z-index: 9999;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: $space-2;
      padding: $space-1 $space-3;
      max-width: 180px;
      font-size: $font-size-sm;
      color: var(--color-text-primary);
      background: var(--color-bg-primary);
      border: 1px solid var(--color-accent);
      border-radius: $radius-sm;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
      opacity: 0.9;

      &_icon {
        flex-shrink: 0;
        display: flex;
        color: var(--color-accent);

        :deep(svg) {
          width: 13px;
          height: 13px;
        }
      }

      &_label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

</style>
