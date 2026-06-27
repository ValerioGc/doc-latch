import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/document';
import { useRecentStore } from '@/stores/recent';
import { usePdf } from '@/composables/usePdf';
import type { DocumentInfo, PdfError, SecurityInfo } from '@/types/pdf';

const invoke = vi.fn();
const openDialog = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => invoke(...args),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: (...args: unknown[]) => openDialog(...args),
}));

const mockInfo: DocumentInfo = {
  path: '/test/doc.pdf',
  pageCount: 3,
  title: null,
  author: null,
  subject: null,
  creator: null,
  producer: null,
  creationDate: null,
  modDate: null,
  pdfVersion: '1.7',
  pageWidthPt: 595,
  pageHeightPt: 842,
  isEncrypted: false,
};

describe('usePdf', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    invoke.mockReset();
    openDialog.mockReset();
  });

  describe('openRecentFile / loadDocument', () => {
    it('sets the document ready in a fresh tab at 100% zoom', async () => {
      invoke.mockResolvedValue(mockInfo);
      const docStore = useDocumentStore();
      const { openRecentFile } = usePdf();

      await openRecentFile('/test/doc.pdf');

      expect(docStore.state).toBe('ready');
      expect(docStore.zoom).toBe(100);
    });

    it('switches to the existing tab instead of reloading an already open file', async () => {
      invoke.mockResolvedValue(mockInfo);
      const docStore = useDocumentStore();
      const { openRecentFile } = usePdf();
      await openRecentFile('/test/doc.pdf');
      const firstTabId = docStore.activeTabId;
      docStore.setLoading('/test/other.pdf');
      invoke.mockClear();

      await openRecentFile('/test/doc.pdf');

      expect(docStore.activeTabId).toBe(firstTabId);
      expect(docStore.tabs).toHaveLength(2);
      expect(invoke).not.toHaveBeenCalled();
    });

    it('adds the path to recent files on success', async () => {
      invoke.mockResolvedValue(mockInfo);
      const recentStore = useRecentStore();
      const { openRecentFile } = usePdf();

      await openRecentFile('/test/doc.pdf');

      expect(recentStore.entries.map((e) => e.path)).toContain('/test/doc.pdf');
    });

    it('sets password-required state when the backend asks for a password', async () => {
      const err: PdfError = { kind: 'PasswordRequired', message: 'needs password' };
      invoke.mockRejectedValue(err);
      const docStore = useDocumentStore();
      const { openRecentFile } = usePdf();

      await openRecentFile('/test/doc.pdf');

      expect(docStore.state).toBe('password-required');
    });

    it('removes the path from recent files when the file is not found', async () => {
      const err: PdfError = { kind: 'FileNotFound', message: 'missing' };
      invoke.mockRejectedValue(err);
      const recentStore = useRecentStore();
      recentStore.add('/test/doc.pdf');
      const docStore = useDocumentStore();
      const { openRecentFile } = usePdf();

      await openRecentFile('/test/doc.pdf');

      expect(recentStore.entries.map((e) => e.path)).not.toContain('/test/doc.pdf');
      expect(docStore.state).toBe('error');
    });

    it('sets an error state without touching recent files for other error kinds', async () => {
      const err: PdfError = { kind: 'InvalidPdf', message: 'bad pdf' };
      invoke.mockRejectedValue(err);
      const recentStore = useRecentStore();
      recentStore.add('/test/doc.pdf');
      const docStore = useDocumentStore();
      const { openRecentFile } = usePdf();

      await openRecentFile('/test/doc.pdf');

      expect(recentStore.entries.map((e) => e.path)).toContain('/test/doc.pdf');
      expect(docStore.error?.kind).toBe('InvalidPdf');
    });
  });

  describe('openFile', () => {
    it('does nothing when the dialog is cancelled', async () => {
      openDialog.mockResolvedValue(null);
      const docStore = useDocumentStore();
      const { openFile } = usePdf();

      await openFile();

      expect(invoke).not.toHaveBeenCalled();
      expect(docStore.state).toBe('idle');
    });

    it('does nothing when the dialog returns a non-string result', async () => {
      openDialog.mockResolvedValue(['a', 'b']);
      const { openFile } = usePdf();

      await openFile();

      expect(invoke).not.toHaveBeenCalled();
    });

    it('loads the selected file', async () => {
      openDialog.mockResolvedValue('/picked/doc.pdf');
      invoke.mockResolvedValue(mockInfo);
      const docStore = useDocumentStore();
      const { openFile } = usePdf();

      await openFile();

      expect(docStore.state).toBe('ready');
    });
  });

  describe('openWithPassword', () => {
    it('returns false when there is no file path set', async () => {
      const { openWithPassword } = usePdf();

      const result = await openWithPassword('secret');

      expect(result).toBe(false);
      expect(invoke).not.toHaveBeenCalled();
    });

    it('marks the document ready and stores the password on success', async () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/test/doc.pdf');
      invoke.mockResolvedValue(mockInfo);
      const { openWithPassword } = usePdf();

      const result = await openWithPassword('secret');

      expect(result).toBe(true);
      expect(docStore.state).toBe('ready');
      expect(docStore.password).toBe('secret');
    });

    it('returns false without setting an error on wrong password', async () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/test/doc.pdf');
      const err: PdfError = { kind: 'WrongPassword', message: 'nope' };
      invoke.mockRejectedValue(err);
      const { openWithPassword } = usePdf();

      const result = await openWithPassword('wrong');

      expect(result).toBe(false);
      expect(docStore.state).toBe('loading');
    });

    it('sets an error state for non-password failures', async () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/test/doc.pdf');
      const err: PdfError = { kind: 'Unknown', message: 'boom' };
      invoke.mockRejectedValue(err);
      const { openWithPassword } = usePdf();

      const result = await openWithPassword('whatever');

      expect(result).toBe(false);
      expect(docStore.state).toBe('error');
    });
  });

  describe('renderPage', () => {
    it('returns null when no document is open', async () => {
      const { renderPage } = usePdf();

      const result = await renderPage(0, 1);

      expect(result).toBeNull();
      expect(invoke).not.toHaveBeenCalled();
    });

    it('calls render_page when the document has no password', async () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/test/doc.pdf');
      invoke.mockResolvedValue({ imageBase64: 'abc', widthPx: 10, heightPx: 20 });
      const { renderPage } = usePdf();

      const result = await renderPage(0, 1);

      expect(invoke).toHaveBeenCalledWith('render_page', { path: '/test/doc.pdf', page: 0, zoom: 1 });
      expect(result?.widthPx).toBe(10);
    });

    it('calls render_page_with_password when the document is password-protected', async () => {
      const docStore = useDocumentStore();
      docStore.setLoading(mockInfo.path);
      docStore.setReady(mockInfo, 'secret');
      invoke.mockResolvedValue({ imageBase64: 'abc', widthPx: 10, heightPx: 20 });
      const { renderPage } = usePdf();

      await renderPage(1, 1.5);

      expect(invoke).toHaveBeenCalledWith('render_page_with_password', {
        path: mockInfo.path,
        page: 1,
        zoom: 1.5,
        password: 'secret',
      });
    });

    it('sets an error and returns null when rendering fails', async () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/test/doc.pdf');
      const err: PdfError = { kind: 'RenderError', message: 'oops' };
      invoke.mockRejectedValue(err);
      const { renderPage } = usePdf();

      const result = await renderPage(0, 1);

      expect(result).toBeNull();
      expect(docStore.error?.kind).toBe('RenderError');
    });
  });

  describe('getSecurityInfo', () => {
    const mockSecurityInfo: SecurityInfo = {
      isEncrypted: false,
      encryptionMethod: null,
      keyLengthBits: null,
      canPrint: true,
      canPrintHighRes: true,
      canModify: true,
      canCopy: true,
      canAnnotate: true,
      canFillForms: true,
      canExtractForAccessibility: true,
      canAssemble: true,
    };

    it('returns the security info on success', async () => {
      invoke.mockResolvedValue(mockSecurityInfo);
      const { getSecurityInfo } = usePdf();

      const result = await getSecurityInfo('/test/doc.pdf');

      expect(invoke).toHaveBeenCalledWith('get_security_info', { path: '/test/doc.pdf' });
      expect(result).toEqual(mockSecurityInfo);
    });

    it('returns null without touching the document store on failure', async () => {
      const err: PdfError = { kind: 'FileNotFound', message: 'missing' };
      invoke.mockRejectedValue(err);
      const docStore = useDocumentStore();
      const { getSecurityInfo } = usePdf();

      const result = await getSecurityInfo('/test/doc.pdf');

      expect(result).toBeNull();
      expect(docStore.error).toBeNull();
    });
  });

  describe('removePassword', () => {
    it('returns null without calling the backend when no document is open', async () => {
      const { removePassword } = usePdf();

      const result = await removePassword('/test/out.pdf');

      expect(result).toBeNull();
      expect(invoke).not.toHaveBeenCalled();
    });

    it('returns null without calling the backend when the document has no password', async () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/test/doc.pdf');
      docStore.setReady(mockInfo);
      const { removePassword } = usePdf();

      const result = await removePassword('/test/out.pdf');

      expect(result).toBeNull();
      expect(invoke).not.toHaveBeenCalled();
    });

    it('calls remove_password with the in-memory password and returns null on success', async () => {
      const docStore = useDocumentStore();
      docStore.setLoading(mockInfo.path);
      docStore.setReady(mockInfo, 'secret');
      invoke.mockResolvedValue(undefined);
      const { removePassword } = usePdf();

      const result = await removePassword('/test/out.pdf');

      expect(invoke).toHaveBeenCalledWith('remove_password', {
        path: mockInfo.path,
        password: 'secret',
        destination: '/test/out.pdf',
      });
      expect(result).toBeNull();
    });

    it('returns the PdfError on failure', async () => {
      const docStore = useDocumentStore();
      docStore.setLoading(mockInfo.path);
      docStore.setReady(mockInfo, 'secret');
      const err: PdfError = { kind: 'WrongPassword', message: 'nope' };
      invoke.mockRejectedValue(err);
      const { removePassword } = usePdf();

      const result = await removePassword('/test/out.pdf');

      expect(result).toEqual(err);
    });
  });

  describe('addPassword', () => {
    it('returns null without calling the backend when no document is open', async () => {
      const { addPassword } = usePdf();

      const result = await addPassword('new-secret', '/test/out.pdf');

      expect(result).toBeNull();
      expect(invoke).not.toHaveBeenCalled();
    });

    it('calls add_password with the chosen password and returns null on success', async () => {
      const docStore = useDocumentStore();
      docStore.setLoading(mockInfo.path);
      docStore.setReady(mockInfo);
      invoke.mockResolvedValue(undefined);
      const { addPassword } = usePdf();

      const result = await addPassword('new-secret', '/test/out.pdf');

      expect(invoke).toHaveBeenCalledWith('add_password', {
        path: mockInfo.path,
        password: 'new-secret',
        destination: '/test/out.pdf',
      });
      expect(result).toBeNull();
    });

    it('returns the PdfError on failure', async () => {
      const docStore = useDocumentStore();
      docStore.setLoading(mockInfo.path);
      docStore.setReady(mockInfo);
      const err: PdfError = { kind: 'AlreadyEncrypted', message: 'già protetto' };
      invoke.mockRejectedValue(err);
      const { addPassword } = usePdf();

      const result = await addPassword('new-secret', '/test/out.pdf');

      expect(result).toEqual(err);
    });
  });
});
