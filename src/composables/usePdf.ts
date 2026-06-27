import { invoke } from '@tauri-apps/api/core';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { useDocumentStore } from '@/stores/document';
import { useRecentStore } from '@/stores/recent';
import { useUiStore } from '@/stores/ui';
import type { DocumentInfo, PageRenderResult, PdfError, SecurityInfo } from '@/types/pdf';

/**
 * Composable that wraps all Tauri IPC calls related to PDF operations.
 */
export function usePdf() {
  const docStore = useDocumentStore();
  const recentStore = useRecentStore();
  const uiStore = useUiStore();

  /**
   * Loads a PDF from an already-known path (native picker or recent files list).
   */
  async function loadDocument(path: string): Promise<void> {
    docStore.setLoading(path);

    try {
      const info = await invoke<DocumentInfo>('open_pdf', { path });
      docStore.setReady(info);
      uiStore.setZoom(100);
      recentStore.add(path);
    } catch (err) {
      const pdfErr = err as PdfError;
      if (pdfErr.kind === 'PasswordRequired') {
        docStore.setPasswordRequired();
      } else {
        if (pdfErr.kind === 'FileNotFound')
          recentStore.remove(path);
        docStore.setError(pdfErr);
      }
    }
  }

  /**
   * Opens a native file picker and loads the selected PDF.
   */
  async function openFile(): Promise<void> {
    const selected = await openDialog({
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
      multiple: false,
    });

    if (!selected || typeof selected !== 'string')
      return;

    await loadDocument(selected);
  }

  /**
   * Loads a PDF directly from a path picked in the "recent documents" list.
   */
  async function openRecentFile(path: string): Promise<void> {
    await loadDocument(path);
  }

  /**
   * Attempts to open the current document with a password.
   * Returns true on success, false on wrong password.
   */
  async function openWithPassword(password: string): Promise<boolean> {
    const path = docStore.filePath;
    if (!path)
      return false;

    try {
      const info = await invoke<DocumentInfo>('open_pdf_with_password', { path, password });
      docStore.setReady(info, password);
      uiStore.setZoom(100);
      recentStore.add(path);
      return true;
    } catch (err) {
      const pdfErr = err as PdfError;
      if (pdfErr.kind !== 'WrongPassword')
        docStore.setError(pdfErr);

      return false;
    }
  }

  /**
   * Renders a single page and returns a base64 PNG.
   * @param page - 0-based page index
   * @param zoom - zoom factor (1.0 = 100%)
   */
  async function renderPage(page: number, zoom: number): Promise<PageRenderResult | null> {
    if (!docStore.filePath)
      return null;

    try {
      if (docStore.password) {
        return await invoke<PageRenderResult>('render_page_with_password', {
          path: docStore.filePath,
          page,
          zoom,
          password: docStore.password,
        });
      }

      return await invoke<PageRenderResult>('render_page', {
        path: docStore.filePath,
        page,
        zoom,
      });
    } catch (err) {
      docStore.setError(err as PdfError);
      return null;
    }
  }

  /**
   * Reads encryption status and permissions for a PDF, without needing its password.
   * Returns null on error; callers handle their own error display.
   */
  async function getSecurityInfo(path: string): Promise<SecurityInfo | null> {
    try {
      return await invoke<SecurityInfo>('get_security_info', { path });
    } catch {
      return null;
    }
  }

  return { openFile, openRecentFile, openWithPassword, renderPage, getSecurityInfo };
}
