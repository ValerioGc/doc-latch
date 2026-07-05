<script setup lang="ts">

  import { ref, computed, watch, useTemplateRef } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useUiStore } from '@/stores/ui';
  import { useDocumentStore } from '@/stores/document';
  import { useKeyboard } from '@/composables/useKeyboard';

  import TitleBar from '@/components/layout/TitleBar.vue';
  import Toolbar from '@/components/layout/Toolbar.vue';
  import TabBar from '@/components/layout/TabBar.vue';
  import SplitTabHeader from '@/components/layout/SplitTabHeader.vue';
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

  // ── Split-pane resize ──────────────────────────────────────────────────────
  const SPLIT_MIN = 280;
  const SPLIT_DIVIDER_WIDTH = 6;

  const splitContentRef = useTemplateRef<HTMLElement>('splitContent');
  const splitLeftWidth = ref<number | null>(null);

  watch(() => docStore.splitEnabled, (enabled) => {
    if (!enabled)
      splitLeftWidth.value = null;
  });

  const leftPaneStyle = computed(() => {
    if (!docStore.splitEnabled || splitLeftWidth.value === null)
      return {};
    return { flex: `0 0 ${splitLeftWidth.value}px` };
  });

  function onSplitResizeStart(e: MouseEvent): void {
    e.preventDefault();
    const startX = e.clientX;
    const divider = e.currentTarget as HTMLElement;
    const startWidth = (divider.previousElementSibling as HTMLElement).getBoundingClientRect().width;

    function onMove(ev: MouseEvent): void {
      const containerWidth = splitContentRef.value?.getBoundingClientRect().width ?? 0;
      const maxWidth = containerWidth - SPLIT_DIVIDER_WIDTH - SPLIT_MIN;
      splitLeftWidth.value = Math.max(SPLIT_MIN, Math.min(maxWidth, startWidth + (ev.clientX - startX)));
    }

    function onUp(): void {
      globalThis.removeEventListener('mousemove', onMove);
      globalThis.removeEventListener('mouseup', onUp);
    }

    globalThis.addEventListener('mousemove', onMove);
    globalThis.addEventListener('mouseup', onUp);
  }

</script>

<template>
  <div class="app">
    <TitleBar />
    
    <Toolbar />

    <div class="app_body">
      <Sidebar v-if="!uiStore.sidebarHidden" />

      <div class="app_panes">

        <!-- Split-pane header -->
        <div v-if="docStore.tabs.length > 0" class="app_panes_header">
          <TabBar :style="leftPaneStyle" />
          <template v-if="docStore.splitEnabled">
            <div class="pane_header_sep" :style="{ width: `${SPLIT_DIVIDER_WIDTH}px` }" aria-hidden="true"></div>
            <SplitTabHeader />
          </template>
        </div>

        <!-- Split-pane content -->
        <div class="app_panes_content" ref="splitContent">

          <PdfViewer :style="leftPaneStyle" />
          
          <template v-if="docStore.splitEnabled">
            <hr class="pane_divider"
              :style="{ width: `${SPLIT_DIVIDER_WIDTH}px` }"
              aria-orientation="vertical"
              @mousedown="onSplitResizeStart"
            />
            <SplitPane />
          </template>
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

  .pane_divider {
    flex-shrink: 0;
    border: none;
    margin: 0;
    cursor: col-resize;

    &:hover {
      background: var(--color-accent);
      opacity: 0.3;
    }
  }

  .pane_header_sep {
    flex-shrink: 0;
    background: var(--color-bg-secondary);
    border-bottom: 0.5px solid var(--color-border);
  }

</style>