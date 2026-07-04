<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUiStore } from '@/stores/ui';
import type { SupportedLocale } from '@/types/pdf';

import flagIt from '@/assets/icons/flag-it.svg?url';
import flagGb from '@/assets/icons/flag-gb.svg?url';
import flagFr from '@/assets/icons/flag-fr.svg?url';
import flagDe from '@/assets/icons/flag-de.svg?url';
import languageIcon from '@/assets/icons/language.svg?raw';
import chevronDownIcon from '@/assets/icons/chevron-down.svg?raw';
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
            <div class="lang_select">

                <!-- Overlay to close the menu on outside click -->
                <div v-if="langMenuOpen" class="lang_select_overlay" @click="langMenuOpen = false" />

                <button type="button" class="lang_select_trigger" aria-haspopup="menu" :aria-expanded="langMenuOpen"
                    :aria-label="$t('settings.languageLabel')" @click="langMenuOpen = !langMenuOpen">
                    <img :src="currentLocale.flag" alt="" class="lang_select_flag" />
                    {{ currentLocale.label }}
                    <span class="lang_select_chev" :class="{ open: langMenuOpen }" aria-hidden="true" v-html="chevronDownIcon" />
                </button>

                <ul v-if="langMenuOpen" class="lang_select_menu">
                    <li v-for="locale in locales" :key="locale.value">
                        <button type="button" class="lang_select_option"
                            :aria-current="locale.value === uiStore.locale"
                            @click="selectLocale(locale.value)">
                            <img :src="locale.flag" alt="" class="lang_select_flag" />
                            {{ locale.label }}
                        </button>
                    </li>
                </ul>
            </div>
        </template>
    </SettingsSection>
</template>

<style lang="scss" scoped>

    .lang_select {
        position: relative;

        &_overlay {
            position: fixed;
            inset: 0;
            z-index: 1;
        }

        &_trigger {
            @include flex-row($space-2);
            background: var(--color-bg-secondary);
            border: 0.5px solid var(--color-border-strong);
            border-radius: $radius-md;
            font-size: $font-size-base;
            color: var(--color-text-primary);
            padding: 6px 12px;
            cursor: pointer;

            &:hover {
                background: var(--color-bg-tertiary);
            }
        }

        &_flag {
            width: 18px;
            height: 13px;
            border-radius: 2px;
            object-fit: cover;
            flex-shrink: 0;
        }

        &_chev {
            display: flex;
            margin-left: $space-1;
            color: var(--color-text-tertiary);
            transition: transform $transition-base;

            :deep(svg) {
                width: 12px;
                height: 12px;
            }

            &.open {
                transform: rotate(180deg);
            }
        }

        &_menu {
            @include flex-col(2px);
            position: absolute;
            bottom: calc(100% + 4px);
            right: 0;
            min-width: 140px;
            list-style: none;
            background: var(--color-bg-primary);
            border: 0.5px solid var(--color-border-strong);
            border-radius: $radius-lg;
            padding: $space-1;
            z-index: 2;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
        }

        &_option {
            @include flex-row($space-2);

            width: 100%;
            padding: 8px 10px;
            border-radius: $radius-md;
            font-size: $font-size-base;
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