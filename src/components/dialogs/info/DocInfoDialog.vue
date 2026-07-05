<script setup lang="ts">

  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useDocumentStore } from '@/stores/document';
  import { useUiStore } from '@/stores/ui';
  import { formatPdfDate, formatPageSize } from '@/composables/usePdfFormat';
  import BaseDialog from '@/components/dialogs/BaseDialog.vue';

  const emit = defineEmits<{ close: [] }>();

  const { t } = useI18n();
  const docStore = useDocumentStore();
  const uiStore = useUiStore();

  const notAvailable = computed(() => t('dialog.docInfo.notAvailable'));

  const rows = computed(() => {
    const info = docStore.info;
    if (!info)
      return [];

    return [
      { 
        label: t('dialog.docInfo.path'), 
        value: info.path 
      },
      { 
        label: t('dialog.docInfo.pages'), 
        value: String(info.pageCount) 
      },
      { 
        label: t('dialog.docInfo.pdfTitle'), 
        value: info.title ?? notAvailable.value 
      },
      { 
        label: t('dialog.docInfo.author'), 
        value: info.author ?? notAvailable.value 
      },
      { 
        label: t('dialog.docInfo.subject'), 
        value: info.subject ?? notAvailable.value 
      },
      { 
        label: t('dialog.docInfo.creator'), 
        value: info.creator ?? notAvailable.value 
      },
      { 
        label: t('dialog.docInfo.producer'), 
        value: info.producer ?? notAvailable.value 
      },
      {
        label: t('dialog.docInfo.creationDate'),
        value: info.creationDate ? formatPdfDate(info.creationDate, uiStore.locale) : notAvailable.value
      },
      {
        label: t('dialog.docInfo.modDate'),
        value: info.modDate ? formatPdfDate(info.modDate, uiStore.locale) : notAvailable.value
      },
      {
        label: t('dialog.docInfo.version'),
        value: info.pdfVersion
      },
      {
        label: t('dialog.docInfo.size'),
        value: formatPageSize(info.pageWidthPt, info.pageHeightPt)
      },
      { 
        label: t('dialog.docInfo.encrypted'), 
        value: info.isEncrypted ? t('dialog.docInfo.yes') : t('dialog.docInfo.no') 
      },
    ];
  });

  function close(): void {
    emit('close');
  }

</script>

<template>
  <BaseDialog :title="t('dialog.docInfo.title')" width="480px" @close="close">
    <dl class="info">
      <template v-for="row in rows" :key="row.label">
        <dt class="info_label">{{ row.label }}</dt>
        <dd class="info_value">{{ row.value }}</dd>
      </template>
    </dl>

    <template #actions>
      <button class="btn btn_primary" @click="close">
        {{ t('dialog.docInfo.close') }}
      </button>
    </template>
  </BaseDialog>
</template>

<style lang="scss" scoped>

  .info {
    display: grid;
    grid-template-columns: 130px 1fr;
    row-gap: 10px;
    column-gap: $space-3;

    &_label {
      font-size: $font-size-sm;
      color: var(--color-text-tertiary);
    }

    &_value {
      font-size: $font-size-base;
      color: var(--color-text-primary);
      word-break: break-word;
    }
  }

</style>
