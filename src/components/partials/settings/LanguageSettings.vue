<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUiStore } from '@/stores/ui';
import type { SupportedLocale } from '@/types/pdf';

import flagIt from '@/assets/icons/flag-it.svg?url';
import flagGb from '@/assets/icons/flag-gb.svg?url';
import flagFr from '@/assets/icons/flag-fr.svg?url';
import flagDe from '@/assets/icons/flag-de.svg?url';
import languageIcon from '@/assets/icons/language.svg?raw';
import SettingsSection from './SettingsSection.vue';

const uiStore = useUiStore();

function selectLocale(value: SupportedLocale): void {
    uiStore.setLocale(value);
    langMenuOpen.value = false;
}

const locales: { value: SupportedLocale; label: string; flag: string }[] = [
    { value: 'it', label: 'Italiano', flag: flagIt },
    { value: 'en', label: 'English', flag: flagGb },
    { value: 'fr', label: 'Français', flag: flagFr },
    { value: 'de', label: 'Deutsch', flag: flagDe },
];

const langMenuOpen = ref(false);
const currentLocale = computed(
    () => locales.find((l) => l.value === uiStore.locale) ?? locales[0],
);

</script>

<template>
    <SettingsSection :img="languageIcon" :lang="$t('settings.languageLabel')" :title="$t('settings.language')">
        <template #settings>
            <div class="lang-select">

                <!-- Overlay to close the menu on outside click -->
                <div v-if="langMenuOpen" class="lang-select_overlay" @click="langMenuOpen = false" />

                <button type="button" class="lang-select_trigger" aria-haspopup="menu" :aria-expanded="langMenuOpen"
                    :aria-label="$t('settings.languageLabel')" @click="langMenuOpen = !langMenuOpen">
                    <img :src="currentLocale.flag" alt="" class="lang-select_flag" />
                    {{ currentLocale.label }}
                </button>

                <ul v-if="langMenuOpen" class="lang-select_menu">
                    <li v-for="locale in locales" :key="locale.value">
                        <button type="button" class="lang-select_option"
                            :aria-current="locale.value === uiStore.locale"
                            @click="selectLocale(locale.value)">
                            <img :src="locale.flag" alt="" class="lang-select_flag" />
                            {{ locale.label }}
                        </button>
                    </li>
                </ul>
            </div>
        </template>
    </SettingsSection>
</template>

<style lang="scss" scoped>

    .lang-select {
        position: relative;

        &_overlay {
            position: fixed;
            inset: 0;
            z-index: 1;
        }

        &_trigger {
            @include flex-row($space-1);
            background: var(--color-bg-secondary);
            border: 0.5px solid var(--color-border-strong);
            border-radius: $radius-md;
            font-size: $font-size-sm;
            color: var(--color-text-primary);
            padding: 3px 8px;
            cursor: pointer;
        }

        &_flag {
            width: 15px;
            height: 11px;
            border-radius: 2px;
            object-fit: cover;
            flex-shrink: 0;
        }

        &_menu {
            @include flex-col(2px);
            position: absolute;
            bottom: calc(100% + 4px);
            right: 0;
            min-width: 140px;
            background: var(--color-bg-primary);
            border: 0.5px solid var(--color-border-strong);
            border-radius: $radius-lg;
            padding: $space-1;
            z-index: 2;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
        }

        &_option {
            @include flex-row($space-1);

            width: 100%;
            padding: 6px 8px;
            border-radius: $radius-md;
            font-size: $font-size-sm;
            color: var(--color-text-primary);
            background: transparent;
            border: none;
            cursor: pointer;
            text-align: left;

            &:hover {
                background: var(--color-bg-secondary);
            }
        }
    }

</style>