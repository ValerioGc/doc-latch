<script setup lang="ts">

  import { useDocumentStore } from '@/stores/document';
  import documentIcon from '@/assets/icons/document.svg?raw';

  import ZoomControls from '@/components/partials/statusBar/ZoomControls.vue';
  import PageSelector from '@/components/partials/statusBar/PageSelector.vue';

  const docStore = useDocumentStore();

</script>

<template>
  <footer class="statusbar" role="contentinfo">
  
    <!-- File name -->
    <div class="s_item">
      <span class="s_item_icon" aria-hidden="true" v-html="documentIcon"></span>
      {{ docStore.fileName ?? $t('statusBar.noFile') }}
    </div>

    <!-- Page info — left pane (active tab) -->
    <PageSelector v-if="docStore.isOpen" />

    <!-- Page info — right pane (split tab, only when doc is ready) -->
    <PageSelector
      v-if="docStore.splitEnabled && docStore.splitTabId && docStore.getTab(docStore.splitTabId)?.state === 'ready'"
      :tab-id="docStore.splitTabId"
    />

    <div class="s_spacer"></div>

    <!-- Zoom controls — hidden in split view (each pane header carries its own) -->
    <ZoomControls v-if="docStore.isOpen && !docStore.splitEnabled" />

  </footer>
</template>

<style lang="scss" scoped>

  .statusbar {
    @extend %flex-row;

    height: var(--statusbar-height);
    background: var(--color-bg-secondary);
    border-top: 0.5px solid var(--color-border);
    padding: 0 10px;
    flex-shrink: 0;
  }

  .s_item {
    @include flex-row(5px);

    font-size: $font-size-xs;
    color: var(--color-text-secondary);
    padding: 0 10px;
    border-right: 0.5px solid var(--color-border);
    height: 100%;

    &:first-child {
      padding-left: 0;
    }
    
    &_icon {
      display: flex;
      
      :deep(svg) {
        width: 13px;
        height: 13px;
      }
    }
  }

  .s_spacer {
    flex: 1;
  } 

</style>