<script setup lang="ts">
  import { ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useDocumentStore } from '@/stores/document';
  import { useRecentStore } from '@/stores/recent';
  import { usePdf } from '@/composables/usePdf';
  import DocInfoDialog from '@/components/dialogs/DocInfoDialog.vue';
  import SecurityInfoDialog from '@/components/dialogs/SecurityInfoDialog.vue';
  import InfoDialog from '@/components/dialogs/InfoDialog.vue';
  import SettingsDialog from '@/components/dialogs/SettingsDialog.vue';
  import fileIcon from '@/assets/icons/file.svg?raw';
  import settingsIcon from '@/assets/icons/settings.svg?raw';
  import infoIcon from '@/assets/icons/info.svg?raw';
  import shieldIcon from '@/assets/icons/shield.svg?raw';
  import chevronDownIcon from '@/assets/icons/chevron-down.svg?raw';
  import chevronRightIcon from '@/assets/icons/chevron-right.svg?raw';
  import recentIcon from '@/assets/icons/recent.svg?raw';
  import documentIcon from '@/assets/icons/document.svg?raw';

  const { t } = useI18n();
  const docStore = useDocumentStore();
  const recentStore = useRecentStore();
  const { openFile, openRecentFile } = usePdf();

  const openMenu = ref<string | null>(null);
  const recentSubmenuOpen = ref(false);

  // Dialogs visibility
  const showDocInfo = ref(false);
  const showSecurityInfo = ref(false);
  const showInfo = ref(false);
  const showSettings = ref(false);

  function toggle(menu: string): void {
    openMenu.value = openMenu.value === menu ? null : menu;
  }

  function closeMenus(): void {
    openMenu.value = null;
    recentSubmenuOpen.value = false;
  }

  function handleOpenFile(): void {
    closeMenus();
    void openFile();
  }

  function toggleRecentSubmenu(): void {
    if (recentStore.entries.length === 0)
      return;

    recentSubmenuOpen.value = !recentSubmenuOpen.value;
  }

  function openRecentSubmenu(): void {
    if (recentStore.entries.length === 0)
      return;

    recentSubmenuOpen.value = true;
  }

  function closeRecentSubmenu(): void {
    recentSubmenuOpen.value = false;
  }

  function handleOpenRecent(path: string): void {
    closeMenus();
    void openRecentFile(path);
  }

  function handleDocInfo(): void {
    closeMenus();
    showDocInfo.value = true;
  }

  function handleSecurityInfo(): void {
    closeMenus();
    showSecurityInfo.value = true;
  }

  function handleInfo(): void {
    closeMenus();
    showInfo.value = true;
  }

  function handleSettings(): void {
    closeMenus();
    showSettings.value = true;
  }
</script>

<template>
  <!-- Overlay to close menus on outside click -->
  <div v-if="openMenu" class="menu-overlay" @click="closeMenus" />

  <header class="toolbar" role="banner">
    <!-- File menu -->
    <div class="menu-item" @mouseenter="openMenu = 'file'" @mouseleave="closeMenus">
      <button class="menu-btn" :class="{ open: openMenu === 'file' }" @click="toggle('file')">
        <span class="menu-btn-icon" aria-hidden="true" v-html="fileIcon" />
        {{ t('menu.file') }}
        <span class="menu-btn-icon chev" aria-hidden="true" v-html="chevronDownIcon" />
      </button>
      <div v-if="openMenu === 'file'" class="dropdown" role="menu">
        <button class="drop-item" role="menuitem" @click="handleOpenFile">
          <span class="drop-item-icon" aria-hidden="true" v-html="fileIcon" />
          {{ t('menu.open') }}
          <span class="kbd">⌘O</span>
        </button>
        <div class="drop-sep" />
        <div class="drop-item-wrap" @mouseenter="openRecentSubmenu" @mouseleave="closeRecentSubmenu">
          <button
            class="drop-item"
            role="menuitem"
            :class="{ disabled: recentStore.entries.length === 0 }"
            :disabled="recentStore.entries.length === 0"
            aria-haspopup="menu"
            :aria-expanded="recentSubmenuOpen"
            @click="toggleRecentSubmenu"
          >
            <span class="drop-item-icon" aria-hidden="true" v-html="recentIcon" />
            {{ t('menu.recent') }}
            <span class="drop-item-icon chev-right" aria-hidden="true" v-html="chevronRightIcon" />
          </button>

          <div v-if="recentSubmenuOpen" class="dropdown submenu" role="menu">
            <button
              v-for="entry in recentStore.entries"
              :key="entry.path"
              class="drop-item"
              role="menuitem"
              :title="entry.path"
              @click="handleOpenRecent(entry.path)"
            >
              <span class="drop-item-icon" aria-hidden="true" v-html="documentIcon" />
              <span class="drop-item-label">{{ entry.name }}</span>
            </button>
          </div>
        </div>
        <div class="drop-sep" />
        <button
          class="drop-item"
          role="menuitem"
          :disabled="!docStore.isOpen"
          :class="{ disabled: !docStore.isOpen }"
          @click="handleDocInfo"
        >
          <span class="drop-item-icon" aria-hidden="true" v-html="infoIcon" />
          {{ t('menu.docInfo') }}
          <span class="kbd">⌘I</span>
        </button>
      </div>
    </div>

    <!-- Protection menu -->
    <div class="menu-item" @mouseenter="openMenu = 'protection'" @mouseleave="closeMenus">
      <button class="menu-btn" :class="{ open: openMenu === 'protection' }" @click="toggle('protection')">
        <span class="menu-btn-icon" aria-hidden="true" v-html="shieldIcon" />
        {{ t('menu.protection') }}
        <span class="menu-btn-icon chev" aria-hidden="true" v-html="chevronDownIcon" />
      </button>
      <div v-if="openMenu === 'protection'" class="dropdown" role="menu">
        <button
          class="drop-item"
          role="menuitem"
          :disabled="!docStore.isOpen"
          :class="{ disabled: !docStore.isOpen }"
          @click="handleSecurityInfo"
        >
          <span class="drop-item-icon" aria-hidden="true" v-html="shieldIcon" />
          {{ t('menu.securityInfo') }}
        </button>
      </div>
    </div>

    <div class="toolbar-spacer" />
    <div class="toolbar-sep" />

    <!-- Settings -->
    <button
      class="icon-btn"
      :title="t('menu.settings')"
      :aria-label="t('menu.settings')"
      @click="handleSettings"
    >
      <span class="icon-btn-svg" aria-hidden="true" v-html="settingsIcon" />
    </button>

    <!-- Info -->
    <button
      class="icon-btn"
      :title="t('menu.info')"
      :aria-label="t('menu.info')"
      @click="handleInfo"
    >
      <span class="icon-btn-svg" aria-hidden="true" v-html="infoIcon" />
    </button>
  </header>

  <DocInfoDialog v-if="showDocInfo" @close="showDocInfo = false" />
  <SecurityInfoDialog v-if="showSecurityInfo" @close="showSecurityInfo = false" />
  <InfoDialog v-if="showInfo" @close="showInfo = false" />
  <SettingsDialog v-if="showSettings" @close="showSettings = false" />
</template>

<style lang="scss" scoped>
  .toolbar {
    @include flex-row(2px);

    height: var(--toolbar-height);
    background: var(--color-bg-primary);
    border-bottom: 0.5px solid var(--color-border);
    padding: 0 $space-2;
    position: relative;
    z-index: 100;
    flex-shrink: 0;
  }

  .menu-overlay {
    position: fixed;
    inset: 0;
    z-index: 99;
  }

  .icon-btn {
    @extend %flex-center;

    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: $radius-md;
    cursor: pointer;
    color: var(--color-text-secondary);
    margin-right: $space-1;
  }

  .icon-btn:hover {
    background: var(--color-bg-secondary);
  }

  .icon-btn-svg {
    display: flex;
    color: var(--color-text-secondary);
  }

  .icon-btn-svg :deep(svg) {
    width: 18px;
    height: 18px;
  }

  .toolbar-spacer {
    flex: 1;
  }

  .toolbar-sep {
    width: 1px;
    height: 20px;
    background: var(--color-border-strong);
    margin: 0 $space-1;
  }

  .menu-item {
    @extend %flex-row;

    position: relative;
    height: 40px;
  }

  .menu-btn {
    @include flex-row($space-1);

    height: 32px;
    padding: 0 10px;
    font-size: $font-size-base;
    color: var(--color-text-primary);
    background: transparent;
    border: none;
    border-radius: $radius-md;
    cursor: pointer;
  }

  .menu-btn:hover,
  .menu-btn.open {
    background: var(--color-bg-secondary);
  }

  .menu-btn-icon {
    display: flex;
    color: var(--color-text-secondary);
  }

  .menu-btn-icon :deep(svg) {
    width: 16px;
    height: 16px;
  }

  .chev {
    color: var(--color-text-tertiary);

    :deep(svg) {
      width: 11px;
      height: 11px;
    }
  }

  /* Dropdown */
  .dropdown {
    position: absolute;
    top: 38px;
    left: 0;
    min-width: 230px;
    background: var(--color-bg-primary);
    border: 0.5px solid var(--color-border-strong);
    border-radius: $radius-lg;
    padding: $space-1;
    z-index: 200;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  }

  .drop-item {
    @include flex-row(10px);

    padding: 7px 10px;
    border-radius: $radius-md;
    font-size: $font-size-base;
    color: var(--color-text-primary);
    cursor: pointer;
    background: transparent;
    border: none;
    width: 100%;
    text-align: left;
  }

  .drop-item:hover:not(.disabled) {
    background: var(--color-bg-secondary);
  }

  .drop-item.disabled {
    opacity: 0.35;
    cursor: default;
  }

  .drop-item-label {
    @extend %truncate;
  }

  .drop-item-icon {
    display: flex;
    flex-shrink: 0;

    :deep(svg) {
      width: 15px;
      height: 15px;
    }
  }

  .kbd {
    @extend %text-xs;

    margin-left: auto;
  }

  .drop-item-wrap {
    position: relative;
  }

  .chev-right {
    margin-left: auto;
    color: var(--color-text-tertiary);

    :deep(svg) {
      width: 10px;
      height: 10px;
    }
  }

  .submenu {
    top: -4px;
    left: 100%;
    margin-left: 4px;
    max-width: 280px;
  }

  .drop-sep {
    @extend %divider-x;

    margin: 3px 4px;
  }
  
</style>
