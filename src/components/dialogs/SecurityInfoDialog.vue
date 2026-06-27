<script setup lang="ts">

  import { ref, computed, onMounted } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useDocumentStore } from '@/stores/document';
  import { usePdf } from '@/composables/usePdf';
  import type { SecurityInfo } from '@/types/pdf';
  import BaseDialog from '@/components/dialogs/BaseDialog.vue';

  const emit = defineEmits<{ close: [] }>();

  const { t } = useI18n();
  const docStore = useDocumentStore();
  const { getSecurityInfo } = usePdf();

  const loading = ref(true);
  const info = ref<SecurityInfo | null>(null);

  const permissionRows = computed(() => {
    if (!info.value)
      return [];

    return [
      { label: t('dialog.securityInfo.print'), allowed: info.value.canPrint },
      { label: t('dialog.securityInfo.printHighRes'), allowed: info.value.canPrintHighRes },
      { label: t('dialog.securityInfo.modify'), allowed: info.value.canModify },
      { label: t('dialog.securityInfo.copy'), allowed: info.value.canCopy },
      { label: t('dialog.securityInfo.annotate'), allowed: info.value.canAnnotate },
      { label: t('dialog.securityInfo.fillForms'), allowed: info.value.canFillForms },
      { label: t('dialog.securityInfo.accessibility'), allowed: info.value.canExtractForAccessibility },
      { label: t('dialog.securityInfo.assemble'), allowed: info.value.canAssemble },
    ];
  });

  onMounted(async () => {
    const path = docStore.filePath;
    if (path)
      info.value = await getSecurityInfo(path);

    loading.value = false;
  });

  function close(): void {
    emit('close');
  }

</script>

<template>
  <BaseDialog :title="t('dialog.securityInfo.title')" width="420px" @close="close">
    <p v-if="loading" class="security_status">{{ t('dialog.securityInfo.loading') }}</p>
    <p v-else-if="!info" class="security_status security_status--error">
      {{ t('dialog.securityInfo.loadError') }}
    </p>
    <template v-else>
      <dl class="security_list">
        <dt class="security_label">{{ t('dialog.securityInfo.encrypted') }}</dt>
        <dd class="security_value">
          {{ info.isEncrypted ? t('dialog.docInfo.yes') : t('dialog.docInfo.no') }}
        </dd>

        <template v-if="info.isEncrypted">
          <dt class="security_label">{{ t('dialog.securityInfo.method') }}</dt>
          <dd class="security_value">{{ info.encryptionMethod ?? t('dialog.docInfo.notAvailable') }}</dd>

          <dt class="security_label">{{ t('dialog.securityInfo.keyLength') }}</dt>
          <dd class="security_value">
            {{ info.keyLengthBits ? `${info.keyLengthBits} bit` : t('dialog.docInfo.notAvailable') }}
          </dd>
        </template>
      </dl>

      <p v-if="!info.isEncrypted" class="security_hint">
        {{ t('dialog.securityInfo.notEncrypted') }}
      </p>

      <template v-else>
        <h3 class="security_subtitle">{{ t('dialog.securityInfo.permissions') }}</h3>
        <dl class="security_list">
          <template v-for="row in permissionRows" :key="row.label">
            <dt class="security_label">{{ row.label }}</dt>
            <dd class="security_value" :class="{ 'security_value--denied': !row.allowed }">
              {{ row.allowed ? t('dialog.securityInfo.allowed') : t('dialog.securityInfo.notAllowed') }}
            </dd>
          </template>
        </dl>
      </template>
    </template>

    <template #actions>
      <button class="btn btn_primary" @click="close">
        {{ t('dialog.securityInfo.close') }}
      </button>
    </template>
  </BaseDialog>
</template>

<style lang="scss" scoped>

  .security_status {
    font-size: $font-size-base;
    color: var(--color-text-secondary);

    &--error {
      color: var(--color-accent);
    }
  }

  .security_subtitle {
    font-size: $font-size-sm;
    font-weight: 500;
    color: var(--color-text-tertiary);
    margin-top: $space-2;
  }

  .security_list {
    display: grid;
    grid-template-columns: 170px 1fr;
    row-gap: 10px;
    column-gap: $space-3;
  }

  .security_label {
    font-size: $font-size-sm;
    color: var(--color-text-tertiary);
  }

  .security_value {
    font-size: $font-size-base;
    color: var(--color-text-primary);
    word-break: break-word;

    &--denied {
      color: var(--color-accent);
    }
  }

  .security_hint {
    font-size: $font-size-sm;
    color: var(--color-text-secondary);
  }

</style>
