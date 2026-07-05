<script setup lang="ts">

  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useDocumentStore } from '@/stores/document';
  import HomeScreen from '@/components/viewer/HomeScreen.vue';
  import PageCanvas from '@/components/viewer/PageCanvas.vue';
  import errorIcon from '@/assets/icons/error.svg?raw';
  import lockIcon from '@/assets/icons/lock.svg?raw';

  const { t } = useI18n();
  const docStore = useDocumentStore();

  const tab = computed(() => (docStore.splitTabId ? docStore.getTab(docStore.splitTabId) : null));

  const errorMessage = computed(() => {
    const kind = tab.value?.error?.kind ?? 'Unknown';
    const key = kind.charAt(0).toLowerCase() + kind.slice(1);
    return t(`errors.${key}`);
  });

</script>

<template>
  <div class="split_pane">

    <template v-if="tab">

      <!-- Empty state -->
      <HomeScreen v-if="tab.state === 'idle'" />

      <!-- Loading state -->
      <div v-else-if="tab.state === 'loading'" class="empty_state">
        <output class="spinner" aria-label="Caricamento"></output>
      </div>

      <!-- Password required: user must swap panes to unlock -->
      <div v-else-if="tab.state === 'password-required'" class="empty_state">
        <span class="empty_state_icon" aria-hidden="true" v-html="lockIcon" />
        <p class="empty_state_title">{{ $t('errors.passwordRequired') }}</p>
      </div>

      <!-- Error state -->
      <div v-else-if="tab.state === 'error'" class="empty_state error">
        <span class="empty_state_icon" aria-hidden="true" v-html="errorIcon" />
        <p class="empty_state_title">{{ errorMessage }}</p>
      </div>

      <!-- Document pages -->
      <div v-else-if="tab.state === 'ready'" class="page_list">
        <div v-for="page in tab.info?.pageCount ?? 0" :key="`${tab.id}-${page}`" class="page_slot">
          <PageCanvas :page="page" :tab-id="tab.id" />
        </div>
      </div>

    </template>

  </div>
</template>

<style lang="scss" scoped>

  .split_pane {
    @extend %flex-col;
    @include scrollbar;

    flex: 1;
    min-width: 0;
    background: var(--color-bg-tertiary);
    overflow-y: auto;
    align-items: center;
  }

  .empty_state {
    @include flex-col($space-3);

    flex: 1;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);

    &.error {
      color: var(--color-accent);
    }

    &_icon {
      display: flex;

      :deep(svg) {
        width: 40px;
        height: 40px;
      }
    }

    &_title {
      font-size: $font-size-lg;
      font-weight: 500;
      color: var(--color-text-secondary);
    }
  }

  .spinner {
    display: block;
    width: 28px;
    height: 28px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .page_list {
    @include flex-col($space-6);

    align-items: center;
    padding: $space-5 $space-4;
    width: 100%;
  }

</style>
