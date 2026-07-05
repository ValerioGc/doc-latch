import { invoke } from '@tauri-apps/api/core';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { useDocumentStore } from '@/stores/document';
import { useRecentStore } from '@/stores/recent';
import type { DocumentInfo, PageRenderResult, PdfError, SecurityInfo } from '@/types/pdf';

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

/**
 * Composable that wraps all Tauri IPC calls related to PDF operations.
 */
export function usePdf() {
  const docStore = useDocumentStore();
  const recentStore = useRecentStore();

  /**
   * Loads a PDF from an already-known path (native picker or recent files list).
   * Switches to the existing tab instead of reloading if the file is already open.
   */
  async function loadDocument(path: string): Promise<void> {
    // Already visible in the active pane — nothing to do
    if (docStore.filePath === path)
      return;
    // Already visible in the split pane — do not trigger a pane swap
    if (docStore.splitTabId && docStore.getTab(docStore.splitTabId)?.filePath === path)
      return;
    // Open in a background (non-visible) tab — bring it to the front
    if (docStore.focusTabByPath(path))
      return;

    docStore.setLoading(path);

    try {
      const info = await invoke<DocumentInfo>('open_pdf', { path });
      docStore.setReady(info);
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
   * Loads a PDF into a specific tab without making it the active tab.
   * Used when loading from the HomeScreen shown inside the split pane.
   */
  async function loadDocumentInTab(path: string, tabId: string): Promise<void> {
    // Already visible in the active pane — nothing to do
    if (docStore.filePath === path)
      return;
    // Already visible in the split pane — do not trigger a pane swap
    if (docStore.splitTabId && docStore.getTab(docStore.splitTabId)?.filePath === path)
      return;
    // Open in a background (non-visible) tab — bring it to the front
    if (docStore.focusTabByPath(path))
      return;

    docStore.setTabLoading(tabId, path);

    try {
      const info = await invoke<DocumentInfo>('open_pdf', { path });
      docStore.setTabReady(tabId, info);
      recentStore.add(path);
    } catch (err) {
      const pdfErr = err as PdfError;
      if (pdfErr.kind === 'PasswordRequired') {
        docStore.setPasswordRequired(tabId);
      } else {
        if (pdfErr.kind === 'FileNotFound')
          recentStore.remove(path);
        docStore.setError(pdfErr, tabId);
      }
    }
  }

  /**
   * Opens a native file picker and loads the selected PDF into a specific tab.
   * Used when "Open" is clicked from the HomeScreen inside the split pane.
   */
  async function openFileInTab(tabId: string): Promise<void> {
    const selected = await openDialog({
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
      multiple: false,
    });

    if (!selected || typeof selected !== 'string')
      return;

    await loadDocumentInTab(selected, tabId);
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
   * Renders a page for a specific tab, regardless of which tab is active.
   * Used by the split pane, which shows a tab other than the active one.
   * @param page - 0-based page index
   * @param zoom - zoom factor (1.0 = 100%)
   */
  async function renderPageFor(tabId: string, page: number, zoom: number): Promise<PageRenderResult | null> {
    const tab = docStore.getTab(tabId);
    if (!tab?.filePath)
      return null;

    try {
      if (tab.password) {
        return await invoke<PageRenderResult>('render_page_with_password', {
          path: tab.filePath,
          page,
          zoom,
          password: tab.password,
        });
      }

      return await invoke<PageRenderResult>('render_page', { path: tab.filePath, page, zoom });
    } catch (err) {
      docStore.setError(err as PdfError, tabId);
      return null;
    }
  }

  /**
   * Decrypts the current document and saves an unencrypted copy at `destination`.
   * Uses the password already held in memory from when the document was opened.
   * Returns `null` on success, or the `PdfError` on failure.
   */
  async function removePassword(destination: string): Promise<PdfError | null> {
    const path = docStore.filePath;
    const password = docStore.password;
    if (!path || !password)
      return null;

    try {
      await invoke('remove_password', { path, password, destination });
      return null;
    } catch (err) {
      return err as PdfError;
    }
  }

  /**
   * Encrypts the current document with AES-256 and saves the protected copy at `destination`.
   * Returns `null` on success, or the `PdfError` on failure.
   */
  async function addPassword(password: string, destination: string): Promise<PdfError | null> {
    const path = docStore.filePath;
    if (!path)
      return null;

    try {
      await invoke('add_password', { path, password, destination });
      return null;
    } catch (err) {
      return err as PdfError;
    }
  }

  return {
    openFile,
    openFileInTab,
    openRecentFile,
    loadDocumentInTab,
    openWithPassword,
    renderPage,
    renderPageFor,
    getSecurityInfo,
    removePassword,
    addPassword,
  };
}
