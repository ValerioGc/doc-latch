<script setup lang="ts">
const props = defineProps<{
    img: string;
    lang: string;
    title?: string;
}>();
</script>

<template>
    <section class="settings">
        <p class="settings_section" v-if="props.title">{{ props.title }}</p>
        <div class="settings_row">
            <span class="settings_row_icon" v-html="props.img" aria-hidden="true"></span>
            <span class="settings_row_label">{{ props.lang }}</span>

            <slot name="settings"></slot>
        </div>
    </section>
</template>

<style scoped lang="scss">

    .settings {
        &_section {
            @extend %text-xs;

            padding: 4px 2px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        &_row {
            @include flex-row(10px);

            padding: 7px 2px;
            font-size: $font-size-base;
            color: var(--color-text-primary);
        

            &_icon {
                display: flex;
                color: var(--color-text-secondary);

                :deep(svg) {
                    width: 15px;
                    height: 15px;
                }
            }

            &_label {
                flex: 1;
                cursor: pointer;
            }
        }
    }

</style>