<script setup lang="ts">

  import { useDocumentStore } from '@/stores/document';

  import shieldIcon from '@/assets/icons/shield.svg?raw';
  import unlockIcon from '@/assets/icons/unlock.svg?raw';
  import lockIcon from '@/assets/icons/lock.svg?raw';
  import chevronDownIcon from '@/assets/icons/chevron-down.svg?raw';

  const props = defineProps<{ openMenu: string | null }>();
  const emit = defineEmits<{
    toggle: [menu: string];
    hover: [menu: string];
    close: [];
    securityInfo: [];
    addPassword: [];
    removePassword: [];
  }>();

  const docStore = useDocumentStore();

  function handleHover(): void {
    if (docStore.isOpen)
      emit('hover', 'protection');
  }

  function handleToggle(): void {
    if (docStore.isOpen)
      emit('toggle', 'protection');
  }

  function handleSecurityInfo(): void {
    emit('close');
    emit('securityInfo');
  }

  function handleAddPassword(): void {
    emit('close');
    emit('addPassword');
  }

  function handleRemovePassword(): void {
    emit('close');
    emit('removePassword');
  }

</script>

<template>
  <!-- Protection menu -->
  <div class="menu_item" @mouseenter="handleHover" @mouseleave="emit('close')">
    <button class="menu_btn" :class="{ open: props.openMenu === 'protection', disabled: !docStore.isOpen }"
      :disabled="!docStore.isOpen" @click="handleToggle">
      <span class="menu_btn_icon" aria-hidden="true" v-html="shieldIcon"></span>
      {{ $t('menu.protection') }}
      <span class="menu_btn_icon chev" aria-hidden="true" v-html="chevronDownIcon"></span>
    </button>
    <div v-if="props.openMenu === 'protection'" class="dropdown" role="menu">
      <button class="drop_item" role="menuitem" @click="handleSecurityInfo">
        <span class="drop_item_icon" aria-hidden="true" v-html="shieldIcon"></span>
        {{ $t('menu.securityInfo') }}
      </button>
      <div class="drop_sep"></div>
      <button class="drop_item" role="menuitem" :disabled="docStore.info?.isEncrypted"
        :class="{ disabled: docStore.info?.isEncrypted }" @click="handleAddPassword">
        <span class="drop_item_icon" aria-hidden="true" v-html="lockIcon"></span>
        {{ $t('menu.addPassword') }}
      </button>
      <button class="drop_item" role="menuitem" :disabled="!docStore.info?.isEncrypted"
        :class="{ disabled: !docStore.info?.isEncrypted }" @click="handleRemovePassword">
        <span class="drop_item_icon" aria-hidden="true" v-html="unlockIcon"></span>
        {{ $t('menu.removePassword') }}
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

  .drop_sep {
    @extend %drop_sep;
  }

</style>
