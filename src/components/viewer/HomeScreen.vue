<script setup lang="ts">

  import { usePdf } from '@/composables/usePdf';
  import HomeRecent from '@/components/partials/HomeRecent.vue';

  const props = defineProps<{ tabId?: string }>();

  const { openFile, openFileInTab } = usePdf();

  function handleOpen(): void {
    if (props.tabId)
      openFileInTab(props.tabId);
    else
      openFile();
  }

</script>

<template>
  <div class="home">
    <div class="home_main">

      <div class="home_logo" aria-hidden="true">
        <img src="@/assets/logo.svg" alt="" width="28" height="28" />
      </div>

      <p class="home_title">{{ $t('viewer.noDocument') }}</p>
      <p class="home_hint">{{ $t('viewer.openHint') }}</p>

      <button class="btn btn_primary home_open_btn" @click="handleOpen">
        {{ $t('menu.open') }}
      </button>
    </div>

    <HomeRecent :tab-id="props.tabId" />

  </div>
</template>

<style lang="scss" scoped>

  .home {
    @include flex-col(32px);

    flex: 1;
    align-items: center;
    padding: 40px $space-6 $space-6;

    &_main {
      @include flex-col(10px);

      align-items: center;
      flex-shrink: 0;
    }

    &_logo {
      @extend %flex-center;

      width: 48px;
      height: 48px;
      background: var(--color-accent);
      border-radius: 10px;
      margin-bottom: $space-1;
    }

    &_title {
      font-size: $font-size-lg;
      font-weight: 500;
      color: var(--color-text-secondary);
    }

    &_hint {
      font-size: $font-size-base;
      color: var(--color-text-tertiary);
    }

    &_open_btn {
      margin-top: $space-2;
    }    
  }

</style>
