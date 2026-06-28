<script setup lang="ts">

  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useDocumentStore } from '@/stores/document';
  import documentIcon from '@/assets/icons/document.svg?raw';
  import closeIcon from '@/assets/icons/window-close.svg?raw';

  const { t } = useI18n();
  const docStore = useDocumentStore();

  const tab = computed(() => (docStore.splitTabId ? docStore.getTab(docStore.splitTabId) : null));

  function tabName(filePath: string | null): string {
    if (!filePath)
      return t('menu.newTab');

    return filePath.split(/[\\/]/).pop() ?? filePath;
  }

</script>

<template>
  <div class="split_header">
    <div v-if="tab" class="split_header_tab" role="tab" aria-selected="true">
      <span class="split_header_tab-icon" aria-hidden="true" v-html="documentIcon" />
      <span class="split_header_tab-name">{{ tabName(tab.filePath) }}</span>
      <button class="split_header_close"
        :title="t('menu.close')"
        :aria-label="t('menu.close')"
        @click="docStore.closeTab(tab.id)"
      >
        <span class="split_header_close-icon" aria-hidden="true" v-html="closeIcon" />
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
  }

  .split_header_tab {
    @include flex-row($space-2);

    min-width: 0;
    padding: $space-2 $space-2 $space-2 $space-3;
    font-size: $font-size-base;
    color: var(--color-text-primary);
    background: var(--color-bg-primary);
  }

  .split_header_tab-icon {
    display: flex;
    flex-shrink: 0;
    color: var(--color-text-secondary);

    :deep(svg) {
      width: 13px;
      height: 13px;
    }
  }

  .split_header_tab-name {
    @extend %truncate;

    flex: 1;
  }

  .split_header_close {
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
  }

  .split_header_close-icon {
    display: flex;

    :deep(svg) {
      width: 9px;
      height: 9px;
    }
  }

</style>
