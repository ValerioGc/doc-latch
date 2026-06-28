<script setup lang="ts">

  import { useI18n } from 'vue-i18n';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  
  import minimizeIcon from '@/assets/icons/window-minimize.svg?raw';
  import maximizeIcon from '@/assets/icons/window-maximize.svg?raw';
  import closeIcon from '@/assets/icons/window-close.svg?raw';

  const { t } = useI18n();
  const appWindow = getCurrentWindow();

  function minimize(): void {
    appWindow.minimize();
  }

  function toggleMaximize(): void {
    appWindow.toggleMaximize();
  }

  function closeWindow(): void {
    appWindow.close();
  }

  interface TitleBarControl {
    title: string;
    icon: string;
    action: () => void;
  }

  const titlebar_controls: TitleBarControl[] = [
    {
      title: t('titlebar.minimize'),
      icon: minimizeIcon,
      action: minimize,
    },
    {
      title: t('titlebar.maximize'),
      icon: maximizeIcon,
      action: toggleMaximize,
    },
    {
      title: t('titlebar.close'),
      icon: closeIcon,
      action: closeWindow,
    },
];

</script>

<template>
  <div class="titlebar">
    <div class="titlebar_drag" data-tauri-drag-region>
      <div class="titlebar_logo">
        <div class="titlebar_logo_icon" aria-hidden="true">
          <img src="@/assets/logo.svg" alt="" width="13" height="13" />
        </div>
        <span class="titlebar_logo_text">DocLatch</span>
      </div>
    </div>

    <div class="titlebar_controls">
      <button class="titlebar_btn" v-for="control in titlebar_controls" :key="control.title"
          :aria-label="control.title" 
          @click="control.action"
      >
        <span v-html="control.icon"></span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>

  .titlebar {
    @include flex-row;

    height: 32px;
    background: var(--color-bg-primary);
    border-bottom: 0.5px solid var(--color-border);
    flex-shrink: 0;
    justify-content: space-between;
    user-select: none;

    &_drag {
      @include flex-row($space-2);
      flex: 1;
      height: 100%;
      padding: 0 $space-2;
    }

    &_logo {
      @include flex-row($space-2);
    
      &_icon {
        @extend %flex-center;

        width: 18px;
        height: 18px;
        background: var(--color-accent);
        border-radius: $radius-sm;
        flex-shrink: 0;
      }

      &_text {
        font-size: $font-size-base;
        font-weight: 500;
        color: var(--color-text-primary);
      }
    }

    &_controls {
      @include flex-row;
      height: 100%;
    }

    &_btn {
      @extend %flex-center;

      width: 44px;
      height: 100%;
      border: none;
      background: transparent;
      color: var(--color-text-secondary);
      cursor: pointer;

      &:hover {
        background: var(--color-bg-secondary);
      }

      &--close:hover {
        background: #e81123;
        color: white;
      }
      
      & :deep(svg) {
        width: 11px;
        height: 11px;
      }
    }
  }

</style>