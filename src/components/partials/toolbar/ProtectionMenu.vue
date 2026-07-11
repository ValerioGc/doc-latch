<script setup lang="ts">

  import { computed } from 'vue';
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

  type DropItem = { type: 'sep' } | { type: 'btn'; icon: string; labelKey: string; action: () => void; disabled: boolean };

  const items = computed<DropItem[]>(() => [
    { type: 'btn', icon: shieldIcon, labelKey: 'menu.securityInfo',   action: handleSecurityInfo,  disabled: false },
    { type: 'sep' },
    { type: 'btn', icon: lockIcon,   labelKey: 'menu.addPassword',    action: handleAddPassword,   disabled: !!docStore.info?.isEncrypted },
    { type: 'btn', icon: unlockIcon, labelKey: 'menu.removePassword', action: handleRemovePassword, disabled: !docStore.info?.isEncrypted },
  ]);

</script>

<template>
  <div class="menu_item" @mouseenter="handleHover" @mouseleave="emit('close')">
    <button class="menu_btn"
      :class="{ open: props.openMenu === 'protection', disabled: !docStore.isOpen }"
      :disabled="!docStore.isOpen"
      @click="handleToggle">
      <span class="menu_btn_icon" aria-hidden="true" v-html="shieldIcon"></span>
      {{ $t('menu.protection') }}
      <span class="menu_btn_icon chev" aria-hidden="true" v-html="chevronDownIcon"></span>
    </button>

    <div v-if="props.openMenu === 'protection'" class="dropdown" role="menu">
      <template v-for="(item, i) in items" :key="i">
        <div v-if="item.type === 'sep'" class="drop_sep"></div>
        <button v-else
          class="drop_item" role="menuitem"
          :disabled="item.disabled" :class="{ disabled: item.disabled }"
          @click="item.action()">
          <span class="drop_item_icon" aria-hidden="true" v-html="item.icon"></span>
          {{ $t(item.labelKey) }}
        </button>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>

  @include toolbar-menu-classes;

</style>
