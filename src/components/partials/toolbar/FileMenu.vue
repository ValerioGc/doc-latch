<script setup lang="ts">

  import { ref, computed, watch } from 'vue';
  import { useDocumentStore } from '@/stores/document';
  import { useRecentStore } from '@/stores/recent';
  import { usePdf } from '@/composables/usePdf';

  import fileIcon from '@/assets/icons/file.svg?raw';
  import chevronDownIcon from '@/assets/icons/chevron-down.svg?raw';
  import chevronRightIcon from '@/assets/icons/chevron-right.svg?raw';
  import recentIcon from '@/assets/icons/recent.svg?raw';
  import documentIcon from '@/assets/icons/document.svg?raw';
  import infoIcon from '@/assets/icons/info.svg?raw';

  const props = defineProps<{ openMenu: string | null }>();
  const emit = defineEmits<{
    toggle: [menu: string];
    hover: [menu: string];
    close: [];
    docInfo: [];
  }>();

  const docStore = useDocumentStore();
  const recentStore = useRecentStore();
  const { openFile, openRecentFile } = usePdf();

  const recentSubmenuOpen = ref(false);

  watch(() => props.openMenu, (menu) => {
    if (menu !== 'file')
      recentSubmenuOpen.value = false;
  });

  function handleOpenFile(): void {
    emit('close');
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
    emit('close');
    void openRecentFile(path);
  }

  function handleDocInfo(): void {
    emit('close');
    emit('docInfo');
  }

  type DropItem = { icon: string; labelKey: string; action: () => void; disabled: boolean };

  const topItems = computed<DropItem[]>(() => [
    { icon: fileIcon, labelKey: 'menu.open', action: handleOpenFile, disabled: false },
  ]);

  const bottomItems = computed<DropItem[]>(() => [
    { icon: infoIcon, labelKey: 'menu.docInfo', action: handleDocInfo, disabled: !docStore.isOpen },
  ]);

</script>

<template>
  <div class="menu_item" @mouseenter="emit('hover', 'file')" @mouseleave="emit('close')">
    <button class="menu_btn" :class="{ open: props.openMenu === 'file' }" @click="emit('toggle', 'file')">
      <span class="menu_btn_icon" aria-hidden="true" v-html="fileIcon"></span>
      {{ $t('menu.file') }}
      <span class="menu_btn_icon chev" aria-hidden="true" v-html="chevronDownIcon"></span>
    </button>

    <div v-if="props.openMenu === 'file'" class="dropdown" role="menu">

      <button v-for="item in topItems" :key="item.labelKey"
        class="drop_item" role="menuitem"
        :disabled="item.disabled" :class="{ disabled: item.disabled }"
        @click="item.action()">
        <span class="drop_item_icon" aria-hidden="true" v-html="item.icon"></span>
        {{ $t(item.labelKey) }}
      </button>

      <div class="drop_sep"></div>

      <!-- Recent files -->
      <div class="drop_item_wrap" @mouseenter="openRecentSubmenu" @mouseleave="closeRecentSubmenu">
        <button class="drop_item" role="menuitem"
          :disabled="recentStore.entries.length === 0"
          :class="{ disabled: recentStore.entries.length === 0 }"
          aria-haspopup="menu" :aria-expanded="recentSubmenuOpen"
          @click="toggleRecentSubmenu">
          <span class="drop_item_icon" aria-hidden="true" v-html="recentIcon"></span>
          {{ $t('menu.recent') }}
          <span class="drop_item_icon chev_right" aria-hidden="true" v-html="chevronRightIcon"></span>
        </button>

        <div v-if="recentSubmenuOpen" class="dropdown submenu" role="menu">
          <button v-for="entry in recentStore.entries" :key="entry.path"
            class="drop_item" role="menuitem"
            :title="entry.path"
            @click="handleOpenRecent(entry.path)">
            <span class="drop_item_icon" aria-hidden="true" v-html="documentIcon"></span>
            <span class="drop_item_label">{{ entry.name }}</span>
          </button>
        </div>
      </div>

      <div class="drop_sep"></div>

      <button v-for="item in bottomItems" :key="item.labelKey"
        class="drop_item" role="menuitem"
        :disabled="item.disabled" :class="{ disabled: item.disabled }"
        @click="item.action()">
        <span class="drop_item_icon" aria-hidden="true" v-html="item.icon"></span>
        {{ $t(item.labelKey) }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>

  .menu_item {
    @extend %menu_item;
  }

  .menu_btn {
    @extend %menu_btn;
  }

  .menu_btn_icon {
    @extend %menu_btn_icon;
  }

  .chev {
    @extend %chev;
  }

  .dropdown {
    @extend %dropdown;
  }

  .drop_item {
    @extend %drop_item;
  }

  .drop_item_icon {
    @extend %drop_item_icon;
  }

  .drop_item_label {
    @extend %drop_item_label;
  }

  .drop_item_wrap {
    position: relative;
  }

  .drop_sep {
    @extend %drop_sep;
  }

  .chev_right {
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

</style>
