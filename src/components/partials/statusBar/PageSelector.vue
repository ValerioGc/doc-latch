<script setup lang="ts">

  import { nextTick, ref } from 'vue';

  import { useDocumentStore } from '@/stores/document';
  import pageIcon from '@/assets/icons/page.svg?raw';
  import chevronDownIcon from '@/assets/icons/chevron-down.svg?raw';

  const docStore = useDocumentStore();

  const open = ref(false);
  const pageInput = ref(String(docStore.currentPage));
  const inputRef = ref<HTMLInputElement | null>(null);

  function toggle(): void {
    open.value = !open.value;
    if (!open.value)
      return;

    pageInput.value = String(docStore.currentPage);
    nextTick(() => {
      inputRef.value?.focus();
      inputRef.value?.select();
    });
  }

  function close(): void {
    open.value = false;
  }

  function goToPage(): void {
    const page = Number(pageInput.value);
    if (!Number.isNaN(page))
      docStore.setPage(page);

    close();
  }

</script>

<template>
  <div class="page_selector">
    <button class="page_selector-trigger"
      :aria-label="$t('statusBar.goToPageLabel')"
      @click="toggle"
    >
      <span class="page_selector-icon" aria-hidden="true" v-html="pageIcon"></span>
      {{ $t('statusBar.page', { current: docStore.currentPage, total: docStore.totalPages }) }}
      <span class="page_selector-chev" aria-hidden="true" v-html="chevronDownIcon"></span>
    </button>

    <div v-if="open" class="page_selector-overlay" @click="close"></div>

    <dialog v-if="open" open class="page_selector-panel" :aria-label="$t('statusBar.goToPageLabel')">
      <input ref="inputRef" type="number" class="page_selector-input"
        v-model="pageInput"
        min="1"
        :max="docStore.totalPages"
        @keydown.enter="goToPage"
        @keydown.escape="close"
      />
      <button class="btn btn_primary page_selector-go" @click="goToPage">
        {{ $t('statusBar.goToPage') }}
      </button>
    </dialog>
  </div>
</template>

<style lang="scss" scoped>

  .page_selector {
    position: relative;
    height: 100%;

    &-trigger {
      @include flex-row(5px);

      height: 100%;
      padding: 0 10px;
      border: none;
      border-right: 0.5px solid var(--color-border);
      background: transparent;
      font-size: $font-size-xs;
      color: var(--color-text-secondary);
      cursor: pointer;

      &:hover {
        background: var(--color-bg-tertiary);
      }
    }

    &-icon {
      display: flex;

      :deep(svg) {
        width: 12px;
        height: 12px;
      }
    }

    &-chev {
      display: flex;
      color: var(--color-text-tertiary);

      :deep(svg) {
        width: 9px;
        height: 9px;
      }
    }

    &-overlay {
      position: fixed;
      inset: 0;
      z-index: 199;
    }

    &-panel {
      @include flex-row($space-1);

      position: absolute;
      bottom: 100%;
      left: 0;
      margin: 0 0 6px;
      padding: $space-2;
      background: var(--color-bg-primary);
      border: 0.5px solid var(--color-border-strong);
      border-radius: $radius-lg;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.12);
      z-index: 200;
    }

    &-input {
      width: 60px;
      height: 24px;
      padding: 0 $space-2;
      border: 0.5px solid var(--color-border-strong);
      border-radius: $radius-sm;
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
      font-size: $font-size-sm;
      text-align: center;

      &:focus {
        outline: none;
        border-color: var(--color-accent);
      }
    }

    &-go {
      height: 24px;
      padding: 0 $space-3;
      font-size: $font-size-xs;
    }
  }

</style>
