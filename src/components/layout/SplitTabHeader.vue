<script setup lang="ts">

  import { computed, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useDocumentStore } from '@/stores/document';
  import { startTabDrag, endTabDrag, getActiveDragTabId } from '@/composables/useTabDrag';
  import documentIcon from '@/assets/icons/document.svg?raw';
  import closeIcon from '@/assets/icons/window-close.svg?raw';

  const { t } = useI18n();
  const docStore = useDocumentStore();

  const tab = computed(() => (docStore.splitTabId ? docStore.getTab(docStore.splitTabId) : null));

  const dragOver = ref(false);

  function onDragStart(e: DragEvent): void {
    if (!tab.value)
      return;
    startTabDrag(tab.value.id, e);
  }

  function onDragEnd(): void {
    endTabDrag();
    dragOver.value = false;
  }

  function onDragOver(e: DragEvent): void {
    if (!getActiveDragTabId() || !docStore.splitEnabled)
      return;
    e.preventDefault();
    e.dataTransfer && (e.dataTransfer.dropEffect = 'move');
    dragOver.value = true;
  }

  function onDragLeave(e: DragEvent): void {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node))
      dragOver.value = false;
  }

  function onDrop(): void {
    const draggedId = getActiveDragTabId();
    endTabDrag();
    dragOver.value = false;
    if (draggedId && draggedId !== docStore.splitTabId)
      docStore.swapSplitTabs();
  }

  function tabName(filePath: string | null): string {
    if (!filePath)
      return t('menu.newTab');

    return filePath.split(/[\\/]/).pop() ?? filePath;
  }

</script>

<template>
  <div class="split_header"
    :class="{ 'drop-over': dragOver }"
    @dragover="onDragOver($event)"
    @dragleave="onDragLeave($event)"
    @drop="onDrop"
  >
    <div v-if="tab" class="split_header_tab"
      role="tab"
      aria-selected="true"
      draggable="true"
      @dragstart="onDragStart"
      @dragend="onDragEnd"
    >
      <span class="split_header_tab_icon" aria-hidden="true" v-html="documentIcon" />
      <span class="split_header_tab_name">{{ tabName(tab.filePath) }}</span>
      <button class="split_header_close"
        :title="t('menu.close')"
        :aria-label="t('menu.close')"
        @click="docStore.closeTab(tab.id)"
      >
        <span class="split_header_close_icon" aria-hidden="true" v-html="closeIcon" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>

  .split_header {
    @include flex-row;

    flex: 1;
    min-width: 0;
    border-left: 0.5px solid var(--color-border);
    border-bottom: 0.5px solid var(--color-border);
    background: var(--color-bg-secondary);

    &.drop-over {
      outline: 1.5px solid var(--color-accent);
      outline-offset: -1.5px;
    }

    &_tab {
      @include flex-row($space-2);

      min-width: 0;
      padding: $space-2 $space-2 $space-2 $space-3;
      font-size: $font-size-base;
      color: var(--color-text-primary);
      background: var(--color-bg-primary);

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
        flex: 1;
      }
    }

    &_close {
      @extend %flex-center;

      width: 26px;
      height: 26px;
      flex-shrink: 0;
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
  }

</style>
