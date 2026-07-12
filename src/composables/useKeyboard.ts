import { onMounted, onUnmounted } from 'vue';
import { useDocumentStore } from '@/stores/document';

export function useKeyboard(): void {
  const docStore = useDocumentStore();

  function handleZoom(e: KeyboardEvent, delta: number): void {
    if (!e.ctrlKey && !e.metaKey)
      return;
    e.preventDefault();
    if (docStore.focusedPane === 'right' && docStore.splitTabId)
      docStore.adjustTabZoom(docStore.splitTabId, delta);
    else
      docStore.adjustZoom(delta);
  }

  function handleZoomReset(e: KeyboardEvent): void {
    if (!e.ctrlKey && !e.metaKey)
      return;
    e.preventDefault();
    if (docStore.focusedPane === 'right' && docStore.splitTabId)
      docStore.setTabZoom(docStore.splitTabId, 100);
    else
      docStore.setZoom(100);
  }

  function onKeyDown(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement).tagName;

    if (tag === 'INPUT' || tag === 'TEXTAREA')
      return;

    switch (e.key) {
      case 'ArrowDown':
      case 'PageDown':
        e.preventDefault();
        docStore.setPage(docStore.currentPage + 1);
        break;
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        docStore.setPage(docStore.currentPage - 1);
        break;
      case 'Home':
        e.preventDefault();
        docStore.setPage(1);
        break;
      case 'End':
        e.preventDefault();
        docStore.setPage(docStore.totalPages);
        break;
      case '+':
      case '=':
        handleZoom(e, 10);
        break;
      case '-':
        handleZoom(e, -10);
        break;
      case '0':
        handleZoomReset(e);
        break;
      case 'Tab':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          docStore.cycleTab(e.shiftKey ? -1 : 1);
        }
        break;
      case 'w':
      case 'W':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          docStore.close();
        }
        break;
    }
  }

  onMounted(() => globalThis.addEventListener('keydown', onKeyDown));
  onUnmounted(() => globalThis.removeEventListener('keydown', onKeyDown));
}
