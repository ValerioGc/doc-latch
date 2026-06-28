<script setup lang="ts">
import { useRecentStore } from '@/stores/recent';
import documentIcon from '@/assets/icons/document.svg?raw';
import closeIcon from '@/assets/icons/window-close.svg?raw';
import { usePdf } from '@/composables/usePdf';

const recentStore = useRecentStore();
const { openRecentFile } = usePdf();

</script>

<template>
    <div class="recent">
        <p class="recent_title">{{ $t('menu.recent') }}</p>

        <p v-if="recentStore.entries.length === 0" class="recent_empty">
            {{ $t('home.noRecent') }}
        </p>

        <ul v-else class="recent_list">
            <li v-for="entry in recentStore.entries" :key="entry.path" class="recent_row">
                <button class="recent_item" :title="entry.path" @click="openRecentFile(entry.path)">
                    <span class="recent_item-icon" aria-hidden="true" v-html="documentIcon"></span>
                    <span class="recent_name">{{ entry.name }}</span>
                </button>

                <button class="recent_remove" :title="$t('home.removeRecent')" :aria-label="$t('home.removeRecent')"
                    @click.stop="recentStore.remove(entry.path)">
                    <span class="recent_remove-icon" aria-hidden="true" v-html="closeIcon"></span>
                </button>
            </li>
        </ul>
    </div>
</template>


<style lang="scss" scoped>

.recent {
    @include flex-col(6px);
    width: 100%;
    max-width: 420px;

    &_title {
        font-size: $font-size-xs;
        font-weight: 500;
        color: var(--color-text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 0 $space-1 2px;
    }

    &_empty {
        font-size: $font-size-base;
        color: var(--color-text-tertiary);
        padding: $space-1;
    }

    &_list {
        @include flex-col(2px);

        list-style: none;
    }

    &_row {
        @include flex-row;

        border-radius: $radius-md;

        &:hover {
            background: var(--color-bg-secondary);
        }

        &:hover .recent_remove {
            opacity: 1;
        }
    }

    &_item {
        @include flex-row($space-2);

        flex: 1;
        min-width: 0;
        padding: 7px $space-3;
        font-size: $font-size-base;
        color: var(--color-text-primary);
        background: transparent;
        border: none;
        cursor: pointer;
        text-align: left;
    }

    &_item-icon {
        display: flex;
        flex-shrink: 0;
        color: var(--color-text-secondary);

        :deep(svg) {
            width: 14px;
            height: 14px;
        }
    }

    &_name {
        @extend %truncate;
    }

    &_remove {
        @extend %flex-center;

        width: 26px;
        height: 26px;
        margin-right: $space-2;
        flex-shrink: 0;
        border: none;
        background: transparent;
        border-radius: $radius-sm;
        color: var(--color-text-tertiary);
        cursor: pointer;
        opacity: 0;
        transition: opacity $transition-fast, background $transition-fast, color $transition-fast;

        &:hover {
            background: var(--color-bg-tertiary);
            color: var(--color-accent);
        }
    }

    &_remove-icon {
        display: flex;

        :deep(svg) {
            width: 10px;
            height: 10px;
        }
    }
}
</style>
