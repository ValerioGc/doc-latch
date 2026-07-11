<script setup lang="ts">

import { computed } from 'vue';
import { useDocumentStore } from '@/stores/document';
import { useI18n } from 'vue-i18n';

import zoomOutIcon from '@/assets/icons/zoom-out.svg?raw';
import zoomInIcon from '@/assets/icons/zoom-in.svg?raw';
import zoomResetIcon from '@/assets/icons/zoom-reset.svg?raw';

const props = defineProps<{ tabId?: string }>();

const docStore = useDocumentStore();
const { t } = useI18n();

const PRESET_ZOOMS = [50, 75, 100, 125, 150, 200, 300, 400];

const zoomValue = computed(() => {
    if (props.tabId)
        return docStore.getTab(props.tabId)?.zoom ?? 100;
    return docStore.zoom;
});

const zoomOptions = computed(() => {
    if (PRESET_ZOOMS.includes(zoomValue.value))
        return PRESET_ZOOMS;

    return [...PRESET_ZOOMS, zoomValue.value].sort((a, b) => a - b);
});

function onZoomSelect(e: Event): void {
    const value = Number((e.target as HTMLSelectElement).value);
    if (props.tabId)
        docStore.setTabZoom(props.tabId, value);
    else
        docStore.setZoom(value);
}

function adjustZoom(delta: number): void {
    if (props.tabId)
        docStore.adjustTabZoom(props.tabId, delta);
    else
        docStore.adjustZoom(delta);
}

function resetZoom(): void {
    if (props.tabId)
        docStore.setTabZoom(props.tabId, 100);
    else
        docStore.setZoom(100);
}

</script>

<template>
    <fieldset class="zoom">
        <legend class="zoom_legend">{{ t('viewer.zoom') }}</legend>

        <!-- Zoom out button -->
        <button class="zoom_btn"
            :aria-label="`${t('viewer.zoom')} -`"
            @click="adjustZoom(-10)"
            v-html="zoomOutIcon"
        ></button>

        <!-- Zoom select dropdown -->
        <select class="zoom_select"
            :aria-label="t('viewer.zoom')"
            :value="String(zoomValue)"
            @change="onZoomSelect"
        >
            <option v-for="z in zoomOptions" :key="z" :value="String(z)">{{ z }}%</option>
        </select>

        <!-- Zoom in button -->
        <button class="zoom_btn"
            :aria-label="`${t('viewer.zoom')} +`"
            @click="adjustZoom(10)"
            v-html="zoomInIcon"
        ></button>

        <!-- Reset zoom button -->
        <button class="zoom_btn"
            :disabled="zoomValue === 100"
            :title="t('viewer.resetZoom')"
            :aria-label="t('viewer.resetZoom')"
            @click="resetZoom()"
            v-html="zoomResetIcon"
        ></button>
    </fieldset>
</template>

<style lang="scss" scoped>
    .zoom {
        @include flex-row($space-1);
        margin: 0;
        padding: 0;
        border: none;

        &_legend {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }

        &_btn {
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
                width: 13px;
                height: 13px;
            }
        }

        &_select {
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
