<script setup lang="ts">

import { ref, onMounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import infoIcon from '@/assets/icons/info.svg?raw';

const STORAGE_KEY = 'doclatch:default-app-banner-hidden';

const visible = ref(false);
const showPopup = ref(false);

onMounted(async () => {
  if (localStorage.getItem(STORAGE_KEY))
    return;
  const result = await invoke<boolean | null>('check_default_pdf_viewer');
  if (result === false)
    visible.value = true;
});

async function openSettings(): Promise<void> {
  await invoke('set_default_pdf_viewer');
}

function hideSession(): void {
  visible.value = false;
  showPopup.value = false;
}

function hideForever(): void {
  localStorage.setItem(STORAGE_KEY, '1');
  visible.value = false;
  showPopup.value = false;
}

</script>

<template>
  <Transition name="banner">
    <div v-if="visible" class="banner" role="alert">
      <span class="banner_icon" v-html="infoIcon" aria-hidden="true" />
      <span class="banner_msg">{{ $t('banner.defaultApp') }}</span>

      <button type="button" class="banner_action" @click="openSettings">
        {{ $t('banner.openSettings') }}
      </button>

      <div class="banner_close_wrap">
        <button
          type="button"
          class="banner_close"
          :aria-label="$t('banner.close')"
          @click="showPopup = !showPopup"
        >
          &#x2715;
        </button>

        <Transition name="popup">
          <dialog v-if="showPopup" open class="banner_popup" :aria-label="$t('banner.close')">
            <button type="button" class="banner_popup_item" @click="hideSession">
              {{ $t('banner.hideSession') }}
            </button>
            <hr class="banner_popup_sep" />
            <button type="button" class="banner_popup_item" @click="hideForever">
              {{ $t('banner.hideForever') }}
            </button>
          </dialog>
        </Transition>
      </div>

      <div v-if="showPopup" class="banner_backdrop" @click="showPopup = false" />
    </div>
  </Transition>
</template>

<style lang="scss" scoped>

  .banner {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px;
    background: var(--color-warning-bg);
    border-bottom: 0.5px solid var(--color-warning-border);
    flex-shrink: 0;
    z-index: 10;

    &_icon {
      display: flex;
      flex-shrink: 0;
      color: var(--color-warning-text);

      :deep(svg) {
        width: 14px;
        height: 14px;
      }
    }

    &_msg {
      flex: 1;
      font-size: $font-size-sm;
      color: var(--color-warning-text);
    }

    &_action {
      flex-shrink: 0;
      padding: 3px 10px;
      font-size: $font-size-sm;
      font-family: inherit;
      color: var(--color-warning-text);
      background: transparent;
      border: 0.5px solid var(--color-warning-border);
      border-radius: $radius-md;
      cursor: pointer;
      transition: background $transition-fast;
      white-space: nowrap;

      &:hover {
        background: var(--color-warning-border);
      }
    }

    &_close_wrap {
      position: relative;
      flex-shrink: 0;
    }

    &_close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      padding: 0;
      font-size: $font-size-sm;
      font-family: inherit;
      color: var(--color-warning-text);
      background: transparent;
      border: none;
      border-radius: $radius-sm;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity $transition-fast, background $transition-fast;

      &:hover {
        opacity: 1;
        background: var(--color-warning-border);
      }
    }

    &_popup {
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      z-index: 100;
      min-width: 180px;
      margin: 0;
      padding: 0;
      background: var(--color-bg-primary);
      border: 0.5px solid var(--color-border-strong);
      border-radius: $radius-md;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      overflow: hidden;

      &_item {
        display: block;
        width: 100%;
        padding: 8px 12px;
        font-size: $font-size-sm;
        font-family: inherit;
        text-align: left;
        color: var(--color-text-primary);
        background: transparent;
        border: none;
        cursor: pointer;
        transition: background $transition-fast;

        &:hover {
          background: var(--color-bg-secondary);
        }
      }

      &_sep {
        margin: 0;
        border: none;
        border-top: 0.5px solid var(--color-border);
      }
    }

    &_backdrop {
      position: fixed;
      inset: 0;
      z-index: 99;
    }
  }

  // Banner slide-in transition
  .banner-enter-active,
  .banner-leave-active {
    transition: max-height $transition-fast, opacity $transition-fast;
    max-height: 60px;
    overflow: hidden;
  }

  .banner-enter-from,
  .banner-leave-to {
    max-height: 0;
    opacity: 0;
  }

  // Popup fade transition
  .popup-enter-active,
  .popup-leave-active {
    transition: opacity $transition-fast, transform $transition-fast;
  }

  .popup-enter-from,
  .popup-leave-to {
    opacity: 0;
    transform: translateY(-4px);
  }

</style>
