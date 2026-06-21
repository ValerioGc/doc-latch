<script setup lang="ts">

  import { useI18n } from 'vue-i18n';
  import { useDocumentStore } from '@/stores/document';
  import documentIcon from '@/assets/icons/document.svg?raw';
  import pageIcon from '@/assets/icons/page.svg?raw';
  import ZoomControls from '../partials/statusBar/ZoomControls.vue';

  const { t } = useI18n();
  const docStore = useDocumentStore();

</script>

<template>
  <footer class="statusbar" role="contentinfo">
  
    <!-- File name -->
    <div class="s_item">
      <span class="s_item_icon" aria-hidden="true" v-html="documentIcon" />
      {{ docStore.fileName ?? t('statusBar.noFile') }}
    </div>

    <!-- Page info -->
    <div v-if="docStore.isOpen" class="s_item">
      <span class="s_item_icon" aria-hidden="true" v-html="pageIcon"> </span>
      {{ t('statusBar.page', { current: docStore.currentPage, total: docStore.totalPages }) }}
    </div>

    <div class="s_spacer"></div>

    <!-- Zoom controls -->
    <ZoomControls v-if="docStore.isOpen" />

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
        width: 12px;
        height: 12px;
      }
    }
  }

  .s_spacer {
    flex: 1;
  } 

</style>