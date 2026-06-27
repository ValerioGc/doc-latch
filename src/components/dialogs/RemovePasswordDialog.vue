<script setup lang="ts">

  import { ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { save as saveDialog } from '@tauri-apps/plugin-dialog';
  import { useDocumentStore } from '@/stores/document';
  import { usePdf } from '@/composables/usePdf';
  import BaseDialog from '@/components/dialogs/BaseDialog.vue';

  const emit = defineEmits<{ close: [] }>();

  const { t } = useI18n();
  const docStore = useDocumentStore();
  const { removePassword } = usePdf();

  const isSaving = ref(false);
  const hasError = ref(false);
  const isDone = ref(false);

  function suggestedFileName(): string {
    const base = docStore.fileName ?? 'document.pdf';
    const withoutExt = base.replace(/\.pdf$/i, '');
    return `${withoutExt} (${t('dialog.removePassword.suggestedSuffix')}).pdf`;
  }

  async function confirm(): Promise<void> {
    if (isSaving.value)
      return;

    const destination = await saveDialog({
      defaultPath: suggestedFileName(),
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });

    if (!destination)
      return;

    isSaving.value = true;
    hasError.value = false;

    const error = await removePassword(destination);

    isSaving.value = false;
    hasError.value = error !== null;
    isDone.value = error === null;
  }

  function close(): void {
    emit('close');
  }

</script>

<template>
  <BaseDialog :title="t('dialog.removePassword.title')" width="380px" @close="close">
    <p v-if="isDone" class="remove_password_msg">{{ t('dialog.removePassword.success') }}</p>
    <template v-else>
      <p class="remove_password_desc">{{ t('dialog.removePassword.description') }}</p>
      <p v-if="hasError" class="remove_password_msg remove_password_msg--error" role="alert">
        {{ t('dialog.removePassword.error') }}
      </p>
    </template>

    <template #actions>
      <template v-if="!isDone">
        <button class="btn btn_ghost" :disabled="isSaving" @click="close">
          {{ t('dialog.removePassword.cancel') }}
        </button>
        <button class="btn btn_primary" :disabled="isSaving" @click="confirm">
          {{ t('dialog.removePassword.confirm') }}
        </button>
      </template>
      <button v-else class="btn btn_primary" @click="close">
        {{ t('dialog.removePassword.close') }}
      </button>
    </template>
  </BaseDialog>
</template>

<style lang="scss" scoped>

  .remove_password_desc {
    font-size: $font-size-base;
    color: var(--color-text-secondary);
  }

  .remove_password_msg {
    font-size: $font-size-base;
    color: var(--color-text-primary);

    &--error {
      color: var(--color-accent);
    }
  }

</style>
