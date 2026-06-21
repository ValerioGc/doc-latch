<script setup lang="ts">

  import { ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { usePdf } from '@/composables/usePdf';
  import { useDocumentStore } from '@/stores/document';
  import BaseDialog from '@/components/dialogs/BaseDialog.vue';

  const MAX_ATTEMPTS = 3;

  const { t } = useI18n();
  const { openWithPassword } = usePdf();
  const docStore = useDocumentStore();

  const password = ref('');
  const attempts = ref(0);
  const wrongPassword = ref(false);
  const isLoading = ref(false);

  async function submit(): Promise<void> {
    if (!password.value || isLoading.value) 
      return;
    
    isLoading.value = true;
    wrongPassword.value = false;

    const ok = await openWithPassword(password.value);

    if (!ok) {
      attempts.value++;
      wrongPassword.value = true;
      password.value = '';
      if (attempts.value >= MAX_ATTEMPTS) 
        docStore.close();
    }
    isLoading.value = false;
  }

  function cancel(): void {
    docStore.close();
  }

</script>

<template>
  <BaseDialog :title="t('dialog.password.title')" width="340px" :close-on-backdrop="false" @close="cancel">
    <p class="dialog_desc">{{ t('dialog.password.description') }}</p>

    <p v-if="wrongPassword" class="error_msg" role="alert">
      {{ t('dialog.password.wrongPassword') }}
    </p>

    <input type="password" class="password_input"
      v-model="password"
      :placeholder="t('dialog.password.placeholder')"
      :disabled="isLoading"
      autofocus
      @keydown.enter="submit"
    />

    <template #actions>
      <button class="btn btn_ghost" :disabled="isLoading" @click="cancel">
        {{ t('dialog.password.cancel') }}
      </button>
      <button class="btn btn_primary" :disabled="isLoading || !password" @click="submit">
        {{ t('dialog.password.confirm') }}
      </button>
    </template>
  </BaseDialog>
</template>

<style lang="scss" scoped>

  .dialog_desc {
    font-size: $font-size-base;
    color: var(--color-text-secondary);
  }

  .error_msg {
    font-size: $font-size-base;
    color: var(--color-accent);
  }

  .password_input {
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

</style>