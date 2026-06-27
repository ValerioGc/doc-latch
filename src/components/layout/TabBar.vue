<script setup lang="ts">

  import { useI18n } from 'vue-i18n';
  import { useDocumentStore } from '@/stores/document';
  import documentIcon from '@/assets/icons/document.svg?raw';
  import closeIcon from '@/assets/icons/window-close.svg?raw';

  const { t } = useI18n();
  const docStore = useDocumentStore();

  function tabName(filePath: string): string {
    return filePath.split(/[\\/]/).pop() ?? filePath;
  }

</script>

<template>
  <div class="tab_bar" role="tablist">
    <div v-for="tab in docStore.tabs" :key="tab.id"
      class="tab_row"
      :class="{ active: tab.id === docStore.activeTabId }"
    >
      <button class="tab_select"
        role="tab"
        :aria-selected="tab.id === docStore.activeTabId"
        :title="tab.filePath"
        @click="docStore.setActiveTab(tab.id)"
      >
        <span class="tab_select-icon" aria-hidden="true" v-html="documentIcon" />
        <span class="tab_select-name">{{ tabName(tab.filePath) }}</span>
      </button>
      <button class="tab_close"
        :title="t('menu.close')"
        :aria-label="t('menu.close')"
        @click="docStore.closeTab(tab.id)"
      >
        <span class="tab_close-icon" aria-hidden="true" v-html="closeIcon" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>

  .tab_bar {
    @include flex-row;
    @include scrollbar(6px);

    background: var(--color-bg-secondary);
    border-bottom: 0.5px solid var(--color-border);
    overflow-x: auto;
    overflow-y: hidden;
    flex-shrink: 0;
  }

  .tab_row {
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
  }

  .tab_select {
    @include flex-row($space-2);

    min-width: 0;
    padding: $space-2 $space-2 $space-2 $space-3;
    font-size: $font-size-base;
    color: var(--color-text-primary);
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
  }

  .tab_select-icon {
    display: flex;
    flex-shrink: 0;
    color: var(--color-text-secondary);

    :deep(svg) {
      width: 13px;
      height: 13px;
    }
  }

  .tab_select-name {
    @extend %truncate;
  }

  .tab_close {
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
  }

  .tab_close-icon {
    display: flex;

    :deep(svg) {
      width: 9px;
      height: 9px;
    }
  }

</style>
