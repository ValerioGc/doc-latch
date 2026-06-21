<script setup lang="ts">

    import { useUiStore } from '@/stores/ui';
    import sidebarIcon from '@/assets/icons/sidebar.svg?raw';
    import SettingsSection from './SettingsSection.vue';

    const uiStore = useUiStore();

</script>

<template>
    <SettingsSection :img="sidebarIcon" :lang="$t('settings.hideSidebar')">
        <template #settings>
            <label class="toggle-switch">
                <input
                    id="sidebar-toggle"
                    type="checkbox"
                    :checked="uiStore.sidebarHidden"
                    @change="uiStore.setSidebarHidden(!uiStore.sidebarHidden)"
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