<script setup lang="ts">

import { useUiStore } from '@/stores/ui';
import themeIcon from '@/assets/icons/theme.svg?raw';
import SettingsSection from './SettingsSection.vue';

const uiStore = useUiStore();

function handleThemeToggle(): void {
    uiStore.setTheme(uiStore.theme === 'dark' ? 'light' : 'dark');
}

</script>

<template>
    <SettingsSection
        :img="themeIcon"
        :lang="$t('settings.darkMode')"
        :title="$t('settings.appearance')"
    >
        <template #settings>
            <label class="toggle-switch">
                <input
                    id="theme-toggle"
                    type="checkbox"
                    :checked="uiStore.theme === 'dark'"
                    @change="handleThemeToggle"
                />
                <span class="toggle-slider"></span>
            </label>
        </template>
    </SettingsSection>
</template>

<style lang="scss" scoped>
    .toggle-switch {
        @include toggle-switch;
    }
</style>