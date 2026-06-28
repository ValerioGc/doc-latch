<script setup lang="ts">

  import { watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useUiStore } from '@/stores/ui';
  import { useDocumentStore } from '@/stores/document';
  import { useKeyboard } from '@/composables/useKeyboard';

  import TitleBar from '@/components/layout/TitleBar.vue';
  import Toolbar from '@/components/layout/Toolbar.vue';
  import TabBar from '@/components/layout/TabBar.vue';
  import SplitTabHeader from '@/components/layout/SplitTabHeader.vue';
  import SplitToggle from '@/components/layout/SplitToggle.vue';
  import Sidebar from '@/components/layout/Sidebar.vue';
  import StatusBar from '@/components/layout/StatusBar.vue';
  import PdfViewer from '@/components/viewer/PdfViewer.vue';
  import SplitPane from '@/components/viewer/SplitPane.vue';

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

    <div class="app_body">
      <Sidebar v-if="docStore.isOpen && !uiStore.sidebarHidden" />

      <div class="app_panes">
        <div v-if="docStore.tabs.length > 0" class="app_panes_header">
          <TabBar />
          <SplitTabHeader v-if="docStore.splitEnabled" />
          <SplitToggle />
        </div>
        <div class="app_panes_content">
          <PdfViewer />
          <SplitPane v-if="docStore.splitEnabled" />
        </div>
      </div>
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

    &_panes {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;

      &_header {
        display: flex;
        flex-shrink: 0;
      }

      &_content {
        display: flex;
        flex: 1;
        min-height: 0;
      }
    }
  }

</style>