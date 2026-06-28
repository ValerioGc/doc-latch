<script setup lang="ts">

  import { computed } from 'vue';
  import { useDocumentStore } from '@/stores/document';
  import PageCanvas from '@/components/viewer/PageCanvas.vue';

  const docStore = useDocumentStore();

  const tab = computed(() => (docStore.splitTabId ? docStore.getTab(docStore.splitTabId) : null));

</script>

<template>
  <div class="split_pane">
    <div v-if="tab" class="page_list">
      <div v-for="page in tab.info?.pageCount ?? 0" :key="`${tab.id}-${page}`" class="page_slot">
        <PageCanvas :page="page" :tab-id="tab.id" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>

  .split_pane {
    @include scrollbar;

    flex: 1;
    min-width: 0;
    background: var(--color-bg-tertiary);
    overflow-y: auto;
    
    .page_list {
      @include flex-col($space-6);
      
      align-items: center;
      padding: $space-5 $space-4;
      width: 100%;
    }
  }

</style>
