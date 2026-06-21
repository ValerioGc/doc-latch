<script setup lang="ts">

  import BaseDialog from '@/components/dialogs/BaseDialog.vue';
  import AppearanceSettings from '@/components/partials/settings/AppearanceSettings.vue';
  import SidebarSettings from '@/components/partials/settings/SidebarSettings.vue';
  import LanguageSettings from '@/components/partials/settings/LanguageSettings.vue';

  const emit = defineEmits<{ close: [] }>();
  function close(): void {
    emit('close');
  }

</script>

<template>
  <BaseDialog :title="$t('menu.settings')" width="320px" @close="close">
    
    <AppearanceSettings />

    <SidebarSettings />

    <div class="drop-sep"></div>
    
    <LanguageSettings />

    <template #actions>
      <button class="btn btn_primary" @click="close">
        {{ $t('dialog.settings.close') }}
      </button>
    </template>
  </BaseDialog>
</template>

<style lang="scss" scoped>
  
  .drop-sep {
    @extend %divider-x;
    margin: 4px 0;
  }

</style>