<script setup lang="ts">

  import { ref, defineAsyncComponent, type Component } from 'vue';
  import { useI18n } from 'vue-i18n';

  import FileMenu from '@/components/partials/toolbar/FileMenu.vue';
  import ProtectionMenu from '@/components/partials/toolbar/ProtectionMenu.vue';

  import settingsIcon from '@/assets/icons/settings.svg?raw';
  import infoIcon from '@/assets/icons/info.svg?raw';

  type DialogName = 'docInfo' | 'securityInfo' | 'removePassword' | 'addPassword' | 'info' | 'settings';

  const dialogComponents: Record<DialogName, Component> = {
    docInfo: defineAsyncComponent(() => import('@/components/dialogs/info/DocInfoDialog.vue')),
    securityInfo: defineAsyncComponent(() => import('@/components/dialogs/info/SecurityInfoDialog.vue')),
    removePassword: defineAsyncComponent(() => import('@/components/dialogs/password/RemovePasswordDialog.vue')),
    addPassword: defineAsyncComponent(() => import('@/components/dialogs/password/AddPasswordDialog.vue')),
    info: defineAsyncComponent(() => import('@/components/dialogs/info/InfoDialog.vue')),
    settings: defineAsyncComponent(() => import('@/components/dialogs/SettingsDialog.vue')),
  };

  const { t } = useI18n();

  const openMenu = ref<string | null>(null);
  const activeDialog = ref<DialogName | null>(null);

  function closeMenus(): void {
    openMenu.value = null;
  }

  function toggleMenu(menu: string): void {
    openMenu.value = openMenu.value === menu ? null : menu;
  }

  function hoverMenu(menu: string): void {
    openMenu.value = menu;
  }

  function openDialog(name: DialogName): void {
    activeDialog.value = name;
  }

  function closeDialog(): void {
    activeDialog.value = null;
  }

  function handleInfo(): void {
    closeMenus();
    openDialog('info');
  }

  function handleSettings(): void {
    closeMenus();
    openDialog('settings');
  }

</script>

<template>

  <!-- Overlay to close menus on outside click -->
  <div v-if="openMenu" class="menu_overlay" @click="closeMenus"></div>

  <header class="toolbar" role="banner">

    <FileMenu :open-menu="openMenu"
      @toggle="toggleMenu"
      @hover="hoverMenu"
      @close="closeMenus"
      @doc-info="openDialog('docInfo')"
    />

    <ProtectionMenu :open-menu="openMenu"
      @toggle="toggleMenu"
      @hover="hoverMenu"
      @close="closeMenus"
      @security-info="openDialog('securityInfo')"
      @add-password="openDialog('addPassword')"
      @remove-password="openDialog('removePassword')"
    />

    <div class="toolbar_spacer"></div>
    <div class="toolbar_sep"></div>

    <!-- Settings -->
    <button class="icon_btn" :title="t('menu.settings')" :aria-label="t('menu.settings')" @click="handleSettings">
      <span class="icon_btn_svg" aria-hidden="true" v-html="settingsIcon"></span>
    </button>

    <!-- Info -->
    <button class="icon_btn" :title="t('menu.info')" :aria-label="t('menu.info')" @click="handleInfo">
      <span class="icon_btn_svg" aria-hidden="true" v-html="infoIcon"></span>
    </button>
  </header>

  <!-- Active -->
  <component :is="dialogComponents[activeDialog]" v-if="activeDialog" @close="closeDialog" />

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

    &_spacer {
      flex: 1;
    }

    &_sep {
      width: 1px;
      height: 20px;
      background: var(--color-border-strong);
      margin: 0 $space-1;
    }
  }

  .menu_overlay {
    position: fixed;
    inset: 0;
    z-index: 99;
  }

  .icon_btn {
    @extend %flex-center;

    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: $radius-md;
    cursor: pointer;
    color: var(--color-text-secondary);
    margin-right: $space-1;

    &:hover {
      background: var(--color-bg-secondary);
    }

    &_svg {
      display: flex;
      color: var(--color-text-secondary);

      :deep(svg) {
        width: 19px;
        height: 19px;
      }
    }
  }

</style>
