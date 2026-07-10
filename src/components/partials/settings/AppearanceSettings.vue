<script setup lang="ts">

import { useUiStore } from '@/stores/ui';
import type { TextSize } from '@/types/pdf';
import themeIcon from '@/assets/icons/theme.svg?raw';
import fontSizeIcon from '@/assets/icons/font-size.svg?raw';
import SettingsSection from './SettingsSection.vue';

const uiStore = useUiStore();

function handleThemeToggle(): void {
    uiStore.setTheme(uiStore.theme === 'dark' ? 'light' : 'dark');
}

const TEXT_SIZES: { value: TextSize; labelKey: string }[] = [
    { value: 'small',  labelKey: 'settings.textSizeSmall'  },
    { value: 'medium', labelKey: 'settings.textSizeMedium' },
    { value: 'large',  labelKey: 'settings.textSizeLarge'  },
];

</script>

<template>
    <SettingsSection :img="themeIcon" :lang="$t('settings.darkMode')" :title="$t('settings.appearance')">
        <template #settings>
            <label class="toggle_switch">
                <input id="theme-toggle"
                    type="checkbox"
                    :checked="uiStore.theme === 'dark'"
                    @change="handleThemeToggle"
                />
                <span class="toggle_slider"></span>
            </label>
        </template>
    </SettingsSection>

    <SettingsSection :img="fontSizeIcon" :lang="$t('settings.textSize')">
        <template #settings>
            <fieldset class="size_group">
                <legend class="size_legend">{{ $t('settings.textSize') }}</legend>
                <button
                    v-for="size in TEXT_SIZES"
                    :key="size.value"
                    type="button"
                    class="size_btn"
                    :class="{ active: uiStore.textSize === size.value }"
                    :aria-pressed="uiStore.textSize === size.value"
                    @click="uiStore.setTextSize(size.value)"
                >
                    {{ $t(size.labelKey) }}
                </button>
            </fieldset>
        </template>
    </SettingsSection>
</template>

<style lang="scss" scoped>
    .toggle_switch {
        @include toggle-switch;
    }

    .size_group {
        @include flex-row;

        margin: 0;
        padding: 0;
        border: 0.5px solid var(--color-border-strong);
        border-radius: $radius-md;
        overflow: hidden;
    }

    .size_legend {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
    }

    .size_btn {
        padding: 4px 10px;
        font-size: $font-size-sm;
        font-family: inherit;
        color: var(--color-text-secondary);
        background: transparent;
        border: none;
        border-left: 0.5px solid var(--color-border-strong);
        cursor: pointer;
        transition: background $transition-fast, color $transition-fast;
        white-space: nowrap;

        &:first-child {
            border-left: none;
        }

        &:hover:not(.active) {
            background: var(--color-bg-secondary);
            color: var(--color-text-primary);
        }

        &.active {
            background: var(--color-accent);
            color: #fff;
        }
    }
</style>
