<script setup lang="ts">

  import { computed, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useDocumentStore } from '@/stores/document';
  import { startTabDrag, endTabDrag, getActiveDragTabId } from '@/composables/useTabDrag';
  
  import documentIcon from '@/assets/icons/document.svg?raw';
  import closeIcon from '@/assets/icons/window-close.svg?raw';
  import addIcon from '@/assets/icons/zoom-in.svg?raw';

  const { t } = useI18n();
  const docStore = useDocumentStore();

  const visibleTabs = computed(() => docStore.tabs.filter((tab) => tab.id !== docStore.splitTabId));

  const dragOverTabId = ref<string | null>(null);

  function onDragStart(tabId: string, e: DragEvent): void {
    startTabDrag(tabId, e);
  }

  function onDragEnd(): void {
    endTabDrag();
    dragOverTabId.value = null;
  }

  function onDragOver(tabId: string, e: DragEvent): void {
    if (!getActiveDragTabId() || !docStore.splitEnabled)
      return;
    e.preventDefault();
    e.dataTransfer && (e.dataTransfer.dropEffect = 'move');
    dragOverTabId.value = tabId;
  }

  function onDragLeave(e: DragEvent): void {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node))
      dragOverTabId.value = null;
  }

  function onDrop(): void {
    const draggedId = getActiveDragTabId();
    endTabDrag();
    dragOverTabId.value = null;
    if (draggedId === docStore.splitTabId)
      docStore.swapSplitTabs();
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
      :class="{ active: tab.id === docStore.activeTabId, 'drop-over': dragOverTabId === tab.id }"
      draggable="true"
      @dragstart="onDragStart(tab.id, $event)"
      @dragend="onDragEnd"
      @dragover="onDragOver(tab.id, $event)"
      @dragleave="onDragLeave($event)"
      @drop="onDrop"
    >
      <button class="tab_select"
        role="tab"
        :aria-selected="tab.id === docStore.activeTabId"
        :title="tab.filePath ?? t('menu.newTab')"
        @click="docStore.setActiveTab(tab.id)"
      >
        <span class="tab_select_icon" aria-hidden="true" v-html="documentIcon"></span>
        <span class="tab_select_name">{{ tabName(tab.filePath) }}</span>
      </button>
      <button class="tab_close"
        :title="t('menu.close')"
        :aria-label="t('menu.close')"
        @click="docStore.closeTab(tab.id)"
      >
        <span class="tab_close_icon" aria-hidden="true" v-html="closeIcon"></span>
      </button>
    </div>
    <button class="tab_add"
      :title="t('menu.newTab')"
      :aria-label="t('menu.newTab')"
      @click="docStore.newTab()"
    >
      <span class="tab_add_icon" aria-hidden="true" v-html="addIcon"></span>
    </button>
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

    &_row {
      @include flex-row;

      flex-shrink: 0;
      max-width: 200px;
      border-right: 0.5px solid var(--color-border);

      &:hover {
        background: var(--color-bg-tertiary);
      }

      &.active {
        background: var(--color-bg-primary);
      }

      &.drop-over {
        outline: 1.5px solid var(--color-accent);
        outline-offset: -1.5px;
      }
    }

    &_select {
      @include flex-row($space-2);

      min-width: 0;
      padding: $space-2 $space-2 $space-2 $space-3;
      font-size: $font-size-base;
      color: var(--color-text-primary);
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: left;
    
      &_icon {
        display: flex;
        flex-shrink: 0;
        color: var(--color-text-secondary);

        :deep(svg) {
          width: 13px;
          height: 13px;
        }
      }

      &_name {
        @extend %truncate;
      }
    }

    &_close {
      @extend %flex-center;

      width: 26px;
      height: 100%;
      flex-shrink: 0;
      margin-right: $space-1;
      border: none;
      background: transparent;
      border-radius: $radius-sm;
      color: var(--color-text-tertiary);
      cursor: pointer;

      &:hover {
        background: var(--color-bg-tertiary);
        color: var(--color-accent);
      }
      
      &_icon {
        display: flex;
        
        :deep(svg) {
          width: 9px;
          height: 9px;
        }
      }
    }

    &_add {
      @extend %flex-center;

      width: 28px;
      height: 100%;
      flex-shrink: 0;
      margin-left: $space-1;
      border: none;
      background: transparent;
      border-radius: $radius-sm;
      color: var(--color-text-tertiary);
      cursor: pointer;

      &:hover {
        background: var(--color-bg-tertiary);
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
  }


</style>
