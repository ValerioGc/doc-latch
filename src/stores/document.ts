import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { DocumentInfo, PdfError } from '@/types/pdf';

export type DocumentState = 'idle' | 'loading' | 'ready' | 'password-required' | 'error';

export const useDocumentStore = defineStore('document', () => {
  // doc info
  const info = ref<DocumentInfo | null>(null);
  const totalPages = computed(() => info.value?.pageCount ?? 0);
  const filePath = ref<string | null>(null);
  const fileName = computed(() => {
    if (!filePath.value)
      return null;

    return filePath.value.split(/[\\/]/).pop() ?? filePath.value;
  });
  // doc status
  const state = ref<DocumentState>('idle');
  const currentPage = ref(1);
  const error = ref<PdfError | null>(null);
  const isOpen = computed(() => state.value === 'ready');
  // Held in memory only (for re-rendering pages of an encrypted doc)
  const password = ref<string | null>(null);

  function setLoading(path: string): void {
    state.value = 'loading';
    filePath.value = path;
    error.value = null;
    info.value = null;
    password.value = null;
    currentPage.value = 1;
  }

  function setReady(docInfo: DocumentInfo, pwd: string | null = null): void {
    state.value = 'ready';
    info.value = docInfo;
    password.value = pwd;
    currentPage.value = 1;
  }

  function setPasswordRequired(): void {
    state.value = 'password-required';
  }

  function setError(err: PdfError): void {
    state.value = 'error';
    error.value = err;
  }

  function setPage(page: number): void {
    if (page >= 1 && page <= totalPages.value)
      currentPage.value = page;
  }

  function close(): void {
    state.value = 'idle';
    info.value = null;
    filePath.value = null;
    password.value = null;
    error.value = null;
    currentPage.value = 1;
  }

  return {
    state,
    info,
    currentPage,
    error,
    filePath,
    password,
    isOpen,
    totalPages,
    fileName,
    setLoading,
    setReady,
    setPasswordRequired,
    setError,
    setPage,
    close,
  };
});
