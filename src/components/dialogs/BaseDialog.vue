<script setup lang="ts">

  import { onMounted, onUnmounted, useTemplateRef } from 'vue';

  const props = withDefaults(defineProps<{
    title?: string
    ariaLabel?: string
    width?: string
    centered?: boolean
    closeOnBackdrop?: boolean
  }>(), {
    width: '340px',
    centered: false,
    closeOnBackdrop: true,
  });

  const emit = defineEmits<{ close: [] }>();

  const dialogRef = useTemplateRef<HTMLDialogElement>('dialog');

  function onNativeClose(): void {
    emit('close');
  }

  function onBackdropClick(): void {
    if (props.closeOnBackdrop)
      dialogRef.value?.close();
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape')
      dialogRef.value?.close();
  }

  onMounted(() => {
    dialogRef.value?.showModal();
    globalThis.addEventListener('keydown', onKeydown);
  });
  
  onUnmounted(() => globalThis.removeEventListener('keydown', onKeydown));

</script>

<template>
  <dialog ref="dialog" class="dialog_host"
    :aria-label="ariaLabel ?? title"
    @click.self="onBackdropClick"
    @close="onNativeClose"
  >
    <div class="dialog" :class="{ 'dialog--centered': centered }" :style="{ width }">
      <slot name="header">
        <h2 v-if="title" class="dialog_title">{{ title }}</h2>
      </slot>

      <slot></slot>

      <div v-if="$slots.actions" class="dialog_actions">
        <slot name="actions"></slot>
      </div>
    </div>
  </dialog>
</template>

<style lang="scss" scoped>

  .dialog_host {
    @extend %flex-center;

    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;

    &::backdrop {
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(2px);
    }
  }

  .dialog {
    @include flex-col($space-3);
    @include scrollbar(8px);

    background: var(--color-bg-primary);
    border: 0.5px solid var(--color-border-strong);
    border-radius: $radius-xl;
    padding: $space-6;
    max-width: 90vw;
    max-height: 80vh;
    overflow-y: auto;

    &--centered {
      align-items: center;
      text-align: center;
    }

    &_title {
      font-size: $font-size-xl;
      font-weight: 500;
      color: var(--color-text-primary);
    }

    &_actions {
      display: flex;
      justify-content: flex-end;
      gap: $space-2;
    }

    &--centered .dialog_actions {
      justify-content: center;
    }
  }

</style>
