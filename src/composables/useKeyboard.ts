import { onMounted, onUnmounted } from 'vue';
import { useDocumentStore } from '@/stores/document';
import { useUiStore } from '@/stores/ui';

/**
 * Registers global keyboard shortcuts for navigation and zoom.
 */
export function useKeyboard(): void {
  const docStore = useDocumentStore();
  const uiStore = useUiStore();

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
          uiStore.adjustZoom(10);
        }
        break;
      case '-':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          uiStore.adjustZoom(-10);
        }
        break;
      case '0':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          uiStore.setZoom(100);
        }
        break;
    }
  }

  onMounted(() => globalThis.addEventListener('keydown', onKeyDown));
  onUnmounted(() => globalThis.removeEventListener('keydown', onKeyDown));
}
