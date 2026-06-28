import { onMounted, onUnmounted } from 'vue';
import { useDocumentStore } from '@/stores/document';

/**
 * Registers global keyboard shortcuts for navigation and zoom.
 */
export function useKeyboard(): void {
  const docStore = useDocumentStore();

  function onKeyDown(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement).tagName;

    // Ignore shortcuts when typing in inputs
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
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          docStore.adjustZoom(10);
        }
        break;
      case '-':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          docStore.adjustZoom(-10);
        }
        break;
      case '0':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          docStore.setZoom(100);
        }
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
