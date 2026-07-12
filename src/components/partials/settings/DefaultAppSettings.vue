<script setup lang="ts">

import { ref, onMounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import documentIcon from '@/assets/icons/document.svg?raw';
import SettingsSection from './SettingsSection.vue';

const isDefault = ref<boolean | null>(null);
const supported = ref(false);

onMounted(async () => {
  const result = await invoke<boolean | null>('check_default_pdf_viewer');
  if (result === null)
    return;
  supported.value = true;
  isDefault.value = result;
});

async function setAsDefault(): Promise<void> {
  await invoke('set_default_pdf_viewer');
}

</script>

<template>
  <template v-if="supported">
    <SettingsSection
      :img="documentIcon"
      :lang="$t('settings.defaultApp')"
      :title="$t('settings.system')"
    >
      <template #settings>
        <span v-if="isDefault" class="default_badge default_badge_active" :title="$t('settings.defaultAppActive')">
          &#10003;
        </span>
        <button
          v-else
          type="button"
          class="btn_set_default"
          :title="$t('settings.setDefaultAppHint')"
          @click="setAsDefault"
        >
          {{ $t('settings.setDefaultApp') }}
        </button>
      </template>
    </SettingsSection>
  </template>
</template>

<style lang="scss" scoped>

  .default_badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    font-size: $font-size-sm;

    &_active {
      color: var(--color-success, #22c55e);
    }
  }

  .btn_set_default {
    padding: 3px 10px;
    font-size: $font-size-sm;
    font-family: inherit;
    color: #fff;
    background: var(--color-accent);
    border: none;
    border-radius: $radius-md;
    cursor: pointer;
    transition: opacity $transition-fast;
    white-space: nowrap;

    &:hover {
      opacity: 0.85;
    }
  }

</style>
