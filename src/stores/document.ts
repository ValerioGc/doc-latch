import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { clearPageCache } from '@/composables/usePageRenderCache';
import type { DocumentInfo, PdfError } from '@/types/pdf';

export type DocumentState = 'idle' | 'loading' | 'ready' | 'password-required' | 'error';

export interface DocumentTab {
  id: string
  filePath: string | null
  info: DocumentInfo | null
  state: DocumentState
  currentPage: number
  error: PdfError | null
  // Held in memory only (for re-rendering pages of an encrypted doc)
  password: string | null
  zoom: number
}

/** Creates a tab. With no path, it's an empty "new tab" placeholder showing the home screen. */
function createTab(path: string | null = null): DocumentTab {
  return {
    id: crypto.randomUUID(),
    filePath: path,
    info: null,
    state: path ? 'loading' : 'idle',
    currentPage: 1,
    error: null,
    password: null,
    zoom: 100,
  };
}

export const useDocumentStore = defineStore('document', () => {
  const tabs = ref<DocumentTab[]>([]);
  const activeTabId = ref<string | null>(null);
  // The tab shown in the secondary split pane, alongside the active tab.
  const splitTabId = ref<string | null>(null);

  const activeTab = computed(() => tabs.value.find((tab) => tab.id === activeTabId.value) ?? null);
  const splitEnabled = computed(() => splitTabId.value !== null);

  function getTab(id: string): DocumentTab | null {
    return tabs.value.find((tab) => tab.id === id) ?? null;
  }

  /**
   * Makes `id` the active tab. If `id` was shown in the split pane, the panes
   * swap instead — the previously active tab takes its place there — so
   * switching tabs never collapses the split view on its own.
   */
  function activateTab(id: string): void {
    if (splitTabId.value === id) {
      const previousActiveId = activeTabId.value;
      const previousStillOpen = previousActiveId !== null && tabs.value.some((tab) => tab.id === previousActiveId);
      activeTabId.value = id;
      splitTabId.value = previousStillOpen ? previousActiveId : null;
      return;
    }

    activeTabId.value = id;
  }

  // Façade over the active tab: most of the app reads/writes "the current
  // document" without needing to know tabs exist.
  const info = computed(() => activeTab.value?.info ?? null);
  const totalPages = computed(() => info.value?.pageCount ?? 0);
  const filePath = computed(() => activeTab.value?.filePath ?? null);
  const fileName = computed(() => {
    if (!filePath.value)
      return null;

    return filePath.value.split(/[\\/]/).pop() ?? filePath.value;
  });
  const state = computed<DocumentState>(() => activeTab.value?.state ?? 'idle');
  const currentPage = computed(() => activeTab.value?.currentPage ?? 1);
  const error = computed(() => activeTab.value?.error ?? null);
  const isOpen = computed(() => state.value === 'ready');
  const password = computed(() => activeTab.value?.password ?? null);
  const zoom = computed(() => activeTab.value?.zoom ?? 100);

  // Most loads go through setLoading first, but setReady is also called
  // directly in a few places (and by a lot of tests) as a shortcut — fall
  // back to creating a tab from the document's own path when needed.
  function ensureActiveTab(path: string): DocumentTab {
    if (activeTab.value)
      return activeTab.value;

    const tab = createTab(path);
    tabs.value.push(tab);
    activeTabId.value = tab.id;
    return tab;
  }

  /**
   * Opens `path` in the loading state and makes it active. Reuses the active tab
   * if it's an empty "new tab" placeholder, otherwise opens a new tab.
   */
  function setLoading(path: string): void {
    if (activeTab.value?.filePath === null) {
      activeTab.value.filePath = path;
      activeTab.value.state = 'loading';
      return;
    }

    const tab = createTab(path);
    tabs.value.push(tab);
    activateTab(tab.id);
  }

  /** Opens an empty "new tab" placeholder showing the home screen, and makes it active. */
  function newTab(): void {
    const tab = createTab();
    tabs.value.push(tab);
    activateTab(tab.id);
  }

  /** Switches to the tab already open for `path`, if any. Returns whether one was found. */
  function focusTabByPath(path: string): boolean {
    const tab = tabs.value.find((t) => t.filePath === path);
    if (!tab)
      return false;

    activateTab(tab.id);
    return true;
  }

  function setReady(docInfo: DocumentInfo, pwd: string | null = null): void {
    const tab = ensureActiveTab(docInfo.path);
    tab.state = 'ready';
    tab.info = docInfo;
    tab.password = pwd;
    tab.currentPage = 1;
  }

  function setPasswordRequired(): void {
    if (activeTab.value)
      activeTab.value.state = 'password-required';
  }

  /** Sets the error on `tabId`, or on the active tab when omitted. */
  function setError(err: PdfError, tabId?: string): void {
    const tab = tabId ? getTab(tabId) : activeTab.value;
    if (!tab)
      return;

    tab.state = 'error';
    tab.error = err;
  }

  function setPage(page: number): void {
    if (activeTab.value && page >= 1 && page <= totalPages.value)
      activeTab.value.currentPage = page;
  }

  function setZoom(value: number): void {
    if (activeTab.value)
      activeTab.value.zoom = Math.min(400, Math.max(25, value));
  }

  function adjustZoom(delta: number): void {
    setZoom(zoom.value + delta);
  }

  /** Switches the active tab. */
  function setActiveTab(id: string): void {
    if (tabs.value.some((tab) => tab.id === id))
      activateTab(id);
  }

  /** Switches to the next (`delta` 1) or previous (`delta` -1) tab, wrapping around. */
  function cycleTab(delta: number): void {
    if (tabs.value.length === 0)
      return;

    const currentIndex = tabs.value.findIndex((tab) => tab.id === activeTabId.value);
    const nextIndex = (currentIndex + delta + tabs.value.length) % tabs.value.length;
    activateTab(tabs.value[nextIndex].id);
  }

  /** Closes the tab with the given id, activating a neighboring tab if it was the active one. */
  function closeTab(id: string): void {
    const index = tabs.value.findIndex((tab) => tab.id === id);
    if (index === -1)
      return;

    tabs.value.splice(index, 1);
    clearPageCache(id);

    if (splitTabId.value === id)
      splitTabId.value = null;

    if (activeTabId.value !== id)
      return;

    const nextId = (tabs.value[index] ?? tabs.value[index - 1] ?? null)?.id ?? null;
    if (nextId)
      activateTab(nextId);
    else
      activeTabId.value = null;
  }

  /** Closes the active tab. */
  function close(): void {
    if (activeTabId.value)
      closeTab(activeTabId.value);
  }

  /** Opens the split pane with the first ready tab other than the active one, if any. */
  function openSplit(): void {
    const candidate = tabs.value.find((tab) => tab.state === 'ready' && tab.id !== activeTabId.value);
    if (candidate)
      splitTabId.value = candidate.id;
  }

  /** Closes the split pane. */
  function closeSplit(): void {
    splitTabId.value = null;
  }

  /** Toggles the split pane open/closed. */
  function toggleSplit(): void {
    if (splitEnabled.value)
      closeSplit();
    else
      openSplit();
  }

  return {
    tabs,
    activeTabId,
    splitTabId,
    splitEnabled,
    state,
    info,
    currentPage,
    error,
    filePath,
    password,
    zoom,
    isOpen,
    totalPages,
    fileName,
    getTab,
    setLoading,
    newTab,
    focusTabByPath,
    setReady,
    setPasswordRequired,
    setError,
    setPage,
    setZoom,
    adjustZoom,
    setActiveTab,
    cycleTab,
    closeTab,
    close,
    openSplit,
    closeSplit,
    toggleSplit,
  };
});
