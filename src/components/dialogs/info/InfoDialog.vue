<script setup lang="ts">

  import { open } from '@tauri-apps/plugin-shell';
  import BaseDialog from '@/components/dialogs/BaseDialog.vue';

  const emit = defineEmits<{ close: [] }>();

  const version = import.meta.env.VITE_APP_VERSION;
  const githubUrl = import.meta.env.VITE_GITHUB_URL;

  function close(): void {
    emit('close');
  }

  function openGithub(): void {
    void open(githubUrl);
  }

</script>

<template>
  <BaseDialog :title="$t('dialog.about.title')" width="340px" centered @close="close">
    <template #header>
      <div class="dialog_logo">

        <div class="logo_icon" aria-hidden="true">
          <img src="@/assets/logo.svg" alt="" width="16" height="16" />
        </div>

        <h2 class="dialog_title">{{ $t('dialog.about.title') }}</h2>
        <p class="dialog_version">{{ $t('dialog.about.version', { version }) }}</p>
      </div>
    </template>

    <p class="dialog_desc">{{ $t('dialog.about.description') }}</p>

    <template #actions>
      <button class="btn btn_ghost" @click="close">
        {{ $t('dialog.about.close') }}
      </button>
      <button class="btn btn_primary" @click="openGithub">
        {{ $t('dialog.about.github') }}
      </button>
    </template>
  </BaseDialog>
</template>

<style lang="scss" scoped>

  .dialog_logo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .dialog_title {
    font-size: $font-size-xl;
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .dialog_version {
    font-size: $font-size-sm;
    color: var(--color-text-tertiary);
  }

  .dialog_desc {
    font-size: $font-size-base;
    color: var(--color-text-secondary);
  }

  .logo_icon {
    @extend %flex-center;

    width: 32px;
    height: 32px;
    background: var(--color-accent);
    border-radius: $radius-md;
  }

</style>
