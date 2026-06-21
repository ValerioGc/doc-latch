import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { Theme, SupportedLocale } from '@/types/pdf';

const STORAGE_KEY_THEME = 'pdf-reader:theme';
const STORAGE_KEY_LOCALE = 'pdf-reader:locale';
const STORAGE_KEY_SIDEBAR = 'pdf-reader:sidebar-hidden';
const STORAGE_KEY_SIDEBAR_WIDTH = 'pdf-reader:sidebar-width';

const SIDEBAR_WIDTH_DEFAULT = 130;
const SIDEBAR_WIDTH_MIN = 100;
const SIDEBAR_WIDTH_MAX = 260;

export const useUiStore = defineStore('ui', () => {
  // theme
  const theme = ref<Theme>((localStorage.getItem(STORAGE_KEY_THEME) as Theme) ?? 'light');
  // settings
  const sidebarCollapsed = ref(false);
  const sidebarHidden = ref(localStorage.getItem(STORAGE_KEY_SIDEBAR) === 'true');
  const sidebarWidth = ref(
    Number(localStorage.getItem(STORAGE_KEY_SIDEBAR_WIDTH)) || SIDEBAR_WIDTH_DEFAULT,
  );
  const zoom = ref(100);
  // locale 
  const locale = ref<SupportedLocale>(
    (localStorage.getItem(STORAGE_KEY_LOCALE) as SupportedLocale) ?? 'it',
  );


  // ************************** Theme ***************************
  function applyTheme(t: Theme): void {
    const prefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = t === 'dark' || (t === 'system' && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
  }

  function setTheme(t: Theme): void {
    theme.value = t;
  }

  // ************************** Settings ***************************
  function toggleSidebar(): void {
    if (!sidebarHidden.value)
      sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  function setSidebarHidden(hidden: boolean): void {
    sidebarHidden.value = hidden;
    if (hidden)
      sidebarCollapsed.value = false;
  }

  function setSidebarWidth(value: number): void {
    sidebarWidth.value = Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, value));
  }

  function setZoom(value: number): void {
    zoom.value = Math.min(400, Math.max(25, value));
  }

  function adjustZoom(delta: number): void {
    setZoom(zoom.value + delta);
  }

  // ************************** Locale ***************************
  function setLocale(l: SupportedLocale): void {
    locale.value = l;
  }

  // ************************** Watchers ***************************
  // Persist and apply on change
  watch(theme, (t) => {
    localStorage.setItem(STORAGE_KEY_THEME, t);
    applyTheme(t);
  });
  watch(locale, (l) => localStorage.setItem(STORAGE_KEY_LOCALE, l));
  watch(sidebarHidden, (v) => localStorage.setItem(STORAGE_KEY_SIDEBAR, String(v)));
  watch(sidebarWidth, (w) => localStorage.setItem(STORAGE_KEY_SIDEBAR_WIDTH, String(w)));

  applyTheme(theme.value);

  return {
    theme,
    sidebarCollapsed,
    sidebarHidden,
    sidebarWidth,
    locale,
    zoom,
    setTheme,
    toggleSidebar,
    setSidebarHidden,
    setSidebarWidth,
    setLocale,
    setZoom,
    adjustZoom,
  };
});
