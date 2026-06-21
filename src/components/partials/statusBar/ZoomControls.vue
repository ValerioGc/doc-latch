<script setup lang="ts">

import { computed } from 'vue';
import { useUiStore } from '@/stores/ui';
import { useI18n } from 'vue-i18n';

import zoomOutIcon from '@/assets/icons/zoom-out.svg?raw';
import zoomInIcon from '@/assets/icons/zoom-in.svg?raw';
import zoomResetIcon from '@/assets/icons/zoom-reset.svg?raw';

const uiStore = useUiStore();
const { t } = useI18n();

const PRESET_ZOOMS = [50, 75, 100, 125, 150, 200, 300, 400];

const zoomOptions = computed(() => {
    if (PRESET_ZOOMS.includes(uiStore.zoom))
        return PRESET_ZOOMS;

    return [...PRESET_ZOOMS, uiStore.zoom].sort((a, b) => a - b);
});

function onZoomSelect(e: Event): void {
    const select = e.target as HTMLSelectElement;
    uiStore.setZoom(Number(select.value));
}

</script>

<template>
    <div  class="zoom" role="group" :aria-label="t('viewer.zoom')">

        <!-- Zoom out button -->
        <button class="zoom_btn"
            :aria-label="`${t('viewer.zoom')} -`"
            @click="uiStore.adjustZoom(-10)"
            v-html="zoomOutIcon"
        ></button>

        <!-- Zoom select dropdown -->
        <select class="zoom_select"
            :aria-label="t('viewer.zoom')"
            :value="String(uiStore.zoom)"
            @change="onZoomSelect"
        >
            <option v-for="z in zoomOptions" :key="z" :value="String(z)">{{ z }}%</option>
        </select>

        <!-- Zoom in button -->
        <button class="zoom_btn"
            :aria-label="`${t('viewer.zoom')} +`"
            @click="uiStore.adjustZoom(10)"
            v-html="zoomInIcon"
        ></button>
        
        <!-- Reset zoom button -->
        <button class="zoom_btn"
            :disabled="uiStore.zoom === 100"
            :title="t('viewer.resetZoom')"
            :aria-label="t('viewer.resetZoom')"
            @click="uiStore.setZoom(100)"
            v-html="zoomResetIcon"
        ></button>
    </div>
</template>

<style lang="scss" scoped>
    .zoom {
        @include flex-row($space-1);

        .zoom_btn {
            @extend %flex-center;
            width: 24px;
            height: 24px;
            border: 0.5px solid var(--color-border-strong);
            background: var(--color-bg-primary);
            border-radius: $radius-sm;
            cursor: pointer;
            color: var(--color-text-primary);

            &:hover:not(:disabled) {
                background: var(--color-bg-secondary);
            }

            &:disabled {
                opacity: 0.4;
                cursor: default;
            }

            & :deep(svg) {
                width: 12px;
                height: 12px;
            }
        }

        .zoom_select {
            height: 24px;
            border: 0.5px solid var(--color-border-strong);
            background: var(--color-bg-primary);
            border-radius: $radius-sm;
            font-size: $font-size-sm;
            color: var(--color-text-secondary);
            text-align: center;
            cursor: pointer;
        }
    }

</style>