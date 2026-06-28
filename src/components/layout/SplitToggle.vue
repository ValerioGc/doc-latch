<script setup lang="ts">

  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useDocumentStore } from '@/stores/document';
  import splitIcon from '@/assets/icons/split.svg?raw';

  const { t } = useI18n();
  const docStore = useDocumentStore();

  // At least two ready tabs are needed to show two of them side by side.
  const canSplit = computed(() => docStore.tabs.filter((tab) => tab.state === 'ready').length >= 2);

</script>

<template>
  <button class="split_toggle"
    :class="{ active: docStore.splitEnabled }"
    :disabled="!canSplit && !docStore.splitEnabled"
    :title="t('menu.splitView')"
    :aria-label="t('menu.splitView')"
    :aria-pressed="docStore.splitEnabled"
    @click="docStore.toggleSplit()"
  >
    <span class="split_toggle-icon" aria-hidden="true" v-html="splitIcon" />
  </button>
</template>

<style lang="scss" scoped>

  .split_toggle {
    @extend %flex-center;

    width: 28px;
    height: 100%;
    flex-shrink: 0;
    margin-left: auto;
    border: none;
    border-bottom: 0.5px solid var(--color-border);
    background: var(--color-bg-secondary);
    border-radius: $radius-sm;
    color: var(--color-text-tertiary);
    cursor: pointer;

    &:hover:not(:disabled) {
      background: var(--color-bg-tertiary);
      color: var(--color-accent);
    }

    &.active {
      color: var(--color-accent);
    }

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
  }

  .split_toggle-icon {
    display: flex;

    :deep(svg) {
      width: 12px;
      height: 12px;
    }
  }

</style>
