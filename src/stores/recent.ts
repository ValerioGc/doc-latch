import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

const STORAGE_KEY_RECENT = 'doclatch:recent-files';
const MAX_RECENT = 10;

function readStoredFiles(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECENT);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export const useRecentStore = defineStore('recent', () => {
  const files = ref<string[]>(readStoredFiles());

  const entries = computed(() => files.value.map((path) => ({
    path,
    name: path.split(/[\\/]/).pop() ?? path,
  })));

  function add(path: string): void {
    files.value = [path, ...files.value.filter((p) => p !== path)].slice(0, MAX_RECENT);
  }

  function remove(path: string): void {
    files.value = files.value.filter((p) => p !== path);
  }

  function clear(): void {
    files.value = [];
  }

  watch(files, (v) => localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(v)), { deep: true });

  return {
    files,
    entries,
    add,
    remove,
    clear,
  };
});
