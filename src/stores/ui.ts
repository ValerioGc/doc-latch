import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { Theme, SupportedLocale, TextSize } from '@/types/pdf';

const STORAGE_KEY_THEME = 'doclatch:theme';
const STORAGE_KEY_LOCALE = 'doclatch:locale';
const STORAGE_KEY_SIDEBAR = 'doclatch:sidebar-hidden';
const STORAGE_KEY_SIDEBAR_WIDTH = 'doclatch:sidebar-width';
const STORAGE_KEY_TEXT_SIZE = 'doclatch:text-size';

const SIDEBAR_WIDTH_DEFAULT = 130;
const SIDEBAR_WIDTH_MIN = 100;
const SIDEBAR_WIDTH_MAX = 260;

const SUPPORTED_LOCALES = new Set<SupportedLocale>(['it', 'en', 'fr', 'de']);

function resolveSystemLocale(): SupportedLocale {
  const lang = navigator.language.toLowerCase().split('-')[0] as SupportedLocale;
  return SUPPORTED_LOCALES.has(lang) ? lang : 'en';
}

export const useUiStore = defineStore('ui', () => {
  // theme
  const theme = ref<Theme>((localStorage.getItem(STORAGE_KEY_THEME) as Theme) ?? 'light');
  // settings
  const sidebarCollapsed = ref(false);
  const sidebarHidden = ref(localStorage.getItem(STORAGE_KEY_SIDEBAR) === 'true');
  const sidebarWidth = ref(
    Number(localStorage.getItem(STORAGE_KEY_SIDEBAR_WIDTH)) || SIDEBAR_WIDTH_DEFAULT,
  );
  // locale
  const locale = ref<SupportedLocale>(
    (localStorage.getItem(STORAGE_KEY_LOCALE) as SupportedLocale) ?? resolveSystemLocale(),
  );
  // text size
  const textSize = ref<TextSize>(
    (localStorage.getItem(STORAGE_KEY_TEXT_SIZE) as TextSize) ?? 'medium',
  );
  // mobile detection - evaluated once at startup; on Android the viewport equals the display
  const isMobile = ref(window.innerWidth < 768);


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

  // ************************** Locale ***************************
  function setLocale(l: SupportedLocale): void {
    locale.value = l;
  }

  // ************************** Text size ***************************
  function applyTextSize(size: TextSize): void {
    if (size === 'medium')
      delete document.documentElement.dataset.textSize;
    else
      document.documentElement.dataset.textSize = size;
  }

  function setTextSize(size: TextSize): void {
    textSize.value = size;
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
  watch(textSize, (s) => {
    localStorage.setItem(STORAGE_KEY_TEXT_SIZE, s);
    applyTextSize(s);
  });

  applyTheme(theme.value);
  applyTextSize(textSize.value);

  return {
    theme,
    sidebarCollapsed,
    sidebarHidden,
    sidebarWidth,
    locale,
    textSize,
    isMobile,
    setTheme,
    toggleSidebar,
    setSidebarHidden,
    setSidebarWidth,
    setLocale,
    setTextSize,
  };
});
