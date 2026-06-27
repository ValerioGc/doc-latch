<script setup lang="ts">

  import { watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useUiStore } from '@/stores/ui';
  import { useDocumentStore } from '@/stores/document';
  import { useKeyboard } from '@/composables/useKeyboard';

  import TitleBar from '@/components/layout/TitleBar.vue';
  import Toolbar from '@/components/layout/Toolbar.vue';
  import TabBar from '@/components/layout/TabBar.vue';
  import Sidebar from '@/components/layout/Sidebar.vue';
  import StatusBar from '@/components/layout/StatusBar.vue';
  import PdfViewer from '@/components/viewer/PdfViewer.vue';

  const uiStore = useUiStore();
  const docStore = useDocumentStore();

  const { locale } = useI18n({ useScope: 'global' });

  watch(() => uiStore.locale, (l) => {
    locale.value = l;
  });

  useKeyboard();

</script>

<template>
  <div class="app">
    <TitleBar />
    <Toolbar />
    <TabBar v-if="docStore.tabs.length > 0" />
    <div class="app_body">
      <Sidebar v-if="docStore.isOpen && !uiStore.sidebarHidden" />

      <PdfViewer />
    </div>
    <StatusBar />
  </div>
</template>

<style lang="scss">
  @use '@/styles/global';
</style>

<style lang="scss" scoped>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    
    &_body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
  }
  
</style>