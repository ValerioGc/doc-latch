<script setup lang="ts">

  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { open } from '@tauri-apps/plugin-shell';
  import BaseDialog from '@/components/dialogs/BaseDialog.vue';

  const emit = defineEmits<{ close: [] }>();

  const { t } = useI18n();

  const version = import.meta.env.VITE_APP_VERSION;
  const githubUrl = import.meta.env.VITE_GITHUB_URL;

  function close(): void {
    emit('close');
  }

  function openGithub(): void {
    void open(githubUrl);
  }

  const shortcuts = computed(() => [
    { key: '↓  /  Page ↓', desc: t('dialog.about.kbNextPage') },
    { key: '↑  /  Page ↑', desc: t('dialog.about.kbPrevPage') },
    { key: 'Home',          desc: t('dialog.about.kbFirstPage') },
    { key: 'End',           desc: t('dialog.about.kbLastPage') },
    { key: 'Ctrl  +  /  −', desc: t('dialog.about.kbZoom') },
    { key: 'Ctrl  0',       desc: t('dialog.about.kbZoomReset') },
    { key: 'Ctrl  Tab',     desc: t('dialog.about.kbNextTab') },
    { key: 'Ctrl  W',       desc: t('dialog.about.kbCloseTab') },
  ]);

</script>

<template>
  <BaseDialog :title="$t('dialog.about.title')" width="min(90vw, 460px)" @close="close">
    <template #header>
      <div class="dialog_header">
        <div class="logo_icon" aria-hidden="true">
          <img src="@/assets/logo.svg" alt="" width="16" height="16" />
        </div>
        <h2 class="dialog_title">{{ $t('dialog.about.title') }}</h2>
        <p class="dialog_version">{{ $t('dialog.about.version', { version }) }}</p>
      </div>
    </template>

    <section class="info_section">
      <h3 class="info_label">{{ $t('dialog.about.guide') }}</h3>
      <ul class="guide_list">
        <li>{{ $t('dialog.about.guide1') }}</li>
        <li>{{ $t('dialog.about.guide2') }}</li>
        <li>{{ $t('dialog.about.guide3') }}</li>
        <li>{{ $t('dialog.about.guide4') }}</li>
      </ul>
    </section>

    <section class="info_section">
      <h3 class="info_label">{{ $t('dialog.about.shortcuts') }}</h3>
      <dl class="shortcut_list">
        <div v-for="s in shortcuts" :key="s.key" class="shortcut_row">
          <dt class="shortcut_key">{{ s.key }}</dt>
          <dd class="shortcut_desc">{{ s.desc }}</dd>
        </div>
      </dl>
    </section>

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

  .dialog_header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding-bottom: $space-2;
    border-bottom: 0.5px solid var(--color-border);
    width: 100%;
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

  .logo_icon {
    @extend %flex-center;

    width: 32px;
    height: 32px;
    background: var(--color-accent);
    border-radius: $radius-md;
  }

  // ── Sections ──────────────────────────────────────────────────────

  .info_section {
    display: flex;
    flex-direction: column;
    gap: $space-2;
  }

  .info_label {
    margin: 0;
    font-size: $font-size-xs;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-accent);
  }

  // ── Quick guide ───────────────────────────────────────────────────

  .guide_list {
    margin: 0;
    padding-left: $space-4;
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: var(--color-text-secondary);
    font-size: $font-size-sm;
    line-height: 1.5;
  }

  // ── Shortcuts ─────────────────────────────────────────────────────

  .shortcut_list {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .shortcut_row {
    display: flex;
    align-items: center;
    gap: $space-3;
  }

  .shortcut_key {
    font-family: 'Courier New', monospace;
    font-size: $font-size-xs;
    background: var(--color-bg-secondary);
    border: 0.5px solid var(--color-border-strong);
    border-radius: $radius-sm;
    padding: 2px 6px;
    color: var(--color-text-secondary);
    white-space: nowrap;
    flex-shrink: 0;
    min-width: 120px;
  }

  .shortcut_desc {
    margin: 0;
    font-size: $font-size-sm;
    color: var(--color-text-secondary);
  }

  // ── Footer description ────────────────────────────────────────────

  .dialog_desc {
    margin: 0;
    font-size: $font-size-xs;
    color: var(--color-text-tertiary);
    padding-top: $space-2;
    border-top: 0.5px solid var(--color-border);
  }

</style>
