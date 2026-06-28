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
  const { addPassword } = usePdf();

  const password = ref('');
  const isSaving = ref(false);
  const hasError = ref(false);
  const isDone = ref(false);

  function suggestedFileName(): string {
    const base = docStore.fileName ?? 'document.pdf';
    const withoutExt = base.replace(/\.pdf$/i, '');
    return `${withoutExt} (${t('dialog.addPassword.suggestedSuffix')}).pdf`;
  }

  async function confirm(): Promise<void> {
    if (!password.value || isSaving.value)
      return;

    const destination = await saveDialog({
      defaultPath: suggestedFileName(),
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });

    if (!destination)
      return;

    isSaving.value = true;
    hasError.value = false;

    const error = await addPassword(password.value, destination);

    isSaving.value = false;
    hasError.value = error !== null;
    isDone.value = error === null;
  }

  function close(): void {
    emit('close');
  }

</script>

<template>
  <BaseDialog :title="t('dialog.addPassword.title')" width="380px" @close="close">
    <p v-if="isDone" class="add_password_msg">{{ t('dialog.addPassword.success') }}</p>
    <template v-else>
      <p class="add_password_desc">{{ t('dialog.addPassword.description') }}</p>

      <input type="password" class="add_password_input"
        v-model="password"
        :placeholder="t('dialog.addPassword.placeholder')"
        :disabled="isSaving"
        autofocus
        @keydown.enter="confirm"
      />

      <p v-if="hasError" class="add_password_msg add_password_msg--error" role="alert">
        {{ t('dialog.addPassword.error') }}
      </p>
    </template>

    <template #actions>
      <template v-if="!isDone">
        <button class="btn btn_ghost" :disabled="isSaving" @click="close">
          {{ t('dialog.addPassword.cancel') }}
        </button>
        <button class="btn btn_primary" :disabled="isSaving || !password" @click="confirm">
          {{ t('dialog.addPassword.confirm') }}
        </button>
      </template>
      <button v-else class="btn btn_primary" @click="close">
        {{ t('dialog.addPassword.close') }}
      </button>
    </template>
  </BaseDialog>
</template>

<style lang="scss" scoped>

  .add_password {
    
    &_desc {
      font-size: $font-size-base;
      color: var(--color-text-secondary);
      margin-bottom: $space-2;
    }

    &_input {
      width: 100%;
      padding: $space-2 $space-3;
      font-size: $font-size-md;
      background: var(--color-bg-secondary);
      border: 0.5px solid var(--color-border-strong);
      border-radius: $radius-lg;
      color: var(--color-text-primary);
      outline: none;

      &:focus {
        border-color: var(--color-accent);
        box-shadow: 0 0 0 2px rgba($accent, 0.15);
      }
    }

    &_msg {
      font-size: $font-size-base;
      color: var(--color-text-primary);

      &--error {
        color: var(--color-accent);
        margin-top: $space-2;
      }
    }
  }

</style>
