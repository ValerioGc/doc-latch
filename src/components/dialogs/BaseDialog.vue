<script setup lang="ts">

  import { onMounted, onUnmounted } from 'vue';

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

  function close(): void {
    emit('close');
  }

  function onBackdropClick(): void {
    if (props.closeOnBackdrop)
      close();
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape')
      close();
  }

  onMounted(() => window.addEventListener('keydown', onKeydown));
  onUnmounted(() => window.removeEventListener('keydown', onKeydown));

</script>

<template>
  <div class="dialog_backdrop"
    role="dialog"
    aria-modal="true"
    :aria-label="ariaLabel ?? title"
    @click.self="onBackdropClick"
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
  </div>
</template>

<style lang="scss" scoped>

  .dialog_backdrop {
    @extend %overlay;
    @extend %flex-center;

    z-index: 500;
  }

  .dialog {
    @include flex-col($space-3);

    background: var(--color-bg-primary);
    border: 0.5px solid var(--color-border-strong);
    border-radius: $radius-xl;
    padding: $space-6;
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
