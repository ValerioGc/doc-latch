import { describe, it, expect, beforeEach } from 'vitest';
import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/document';
import { useUiStore } from '@/stores/ui';
import { useKeyboard } from '@/composables/useKeyboard';
import type { DocumentInfo } from '@/types/pdf';

const mockInfo: DocumentInfo = {
  path: '/test/doc.pdf',
  pageCount: 5,
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

const Host = defineComponent({
  setup() {
    useKeyboard();
  },
  template: '<div></div>',
});

function press(key: string, options: Partial<KeyboardEventInit> = {}): void {
  globalThis.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true, ...options }));
}

describe('useKeyboard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('goes to the next page on ArrowDown', () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    mount(Host);

    press('ArrowDown');

    expect(docStore.currentPage).toBe(2);
  });

  it('goes to the next page on PageDown', () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    mount(Host);

    press('PageDown');

    expect(docStore.currentPage).toBe(2);
  });

  it('goes to the previous page on ArrowUp', () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    docStore.setPage(3);
    mount(Host);

    press('ArrowUp');

    expect(docStore.currentPage).toBe(2);
  });

  it('goes to the previous page on PageUp', () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    docStore.setPage(3);
    mount(Host);

    press('PageUp');

    expect(docStore.currentPage).toBe(2);
  });

  it('jumps to the first page on Home', () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    docStore.setPage(4);
    mount(Host);

    press('Home');

    expect(docStore.currentPage).toBe(1);
  });

  it('jumps to the last page on End', () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    mount(Host);

    press('End');

    expect(docStore.currentPage).toBe(5);
  });

  it('zooms in on Ctrl/Cmd +', () => {
    const uiStore = useUiStore();
    uiStore.setZoom(100);
    mount(Host);

    press('+', { ctrlKey: true });

    expect(uiStore.zoom).toBe(110);
  });

  it('zooms in on Ctrl/Cmd = as well', () => {
    const uiStore = useUiStore();
    uiStore.setZoom(100);
    mount(Host);

    press('=', { metaKey: true });

    expect(uiStore.zoom).toBe(110);
  });

  it('ignores + without Ctrl/Cmd', () => {
    const uiStore = useUiStore();
    uiStore.setZoom(100);
    mount(Host);

    press('+');

    expect(uiStore.zoom).toBe(100);
  });

  it('zooms out on Ctrl/Cmd -', () => {
    const uiStore = useUiStore();
    uiStore.setZoom(100);
    mount(Host);

    press('-', { ctrlKey: true });

    expect(uiStore.zoom).toBe(90);
  });

  it('ignores - without Ctrl/Cmd', () => {
    const uiStore = useUiStore();
    uiStore.setZoom(100);
    mount(Host);

    press('-');

    expect(uiStore.zoom).toBe(100);
  });

  it('resets zoom to 100 on Ctrl/Cmd 0', () => {
    const uiStore = useUiStore();
    uiStore.setZoom(250);
    mount(Host);

    press('0', { ctrlKey: true });

    expect(uiStore.zoom).toBe(100);
  });

  it('ignores 0 without Ctrl/Cmd', () => {
    const uiStore = useUiStore();
    uiStore.setZoom(250);
    mount(Host);

    press('0');

    expect(uiStore.zoom).toBe(250);
  });

  it('ignores shortcuts when typing in an input', () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    mount(Host);
    const input = document.createElement('input');
    document.body.appendChild(input);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true, bubbles: true }));

    expect(docStore.currentPage).toBe(1);
    document.body.removeChild(input);
  });

  it('ignores shortcuts when typing in a textarea', () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    mount(Host);
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', cancelable: true, bubbles: true }));

    expect(docStore.currentPage).toBe(1);
    document.body.removeChild(textarea);
  });

  it('removes the listener on unmount', () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    const wrapper = mount(Host);

    wrapper.unmount();
    press('ArrowDown');

    expect(docStore.currentPage).toBe(1);
  });
});
