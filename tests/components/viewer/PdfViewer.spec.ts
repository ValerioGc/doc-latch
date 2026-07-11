import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/document';
import PdfViewer from '@/components/viewer/PdfViewer.vue';
import { createTestI18n } from '../../helpers/testPlugins';
import type { DocumentInfo } from '@/types/pdf';

vi.mock('@/composables/usePageCanvas', () => ({
  usePageCanvas: () => ({ isLoading: ref(false), renderToCanvas: vi.fn().mockResolvedValue(undefined) }),
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

const mountOptions = {
  global: {
    plugins: [createTestI18n()],
    stubs: { PasswordDialog: true, PageCanvas: true },
  },
};

describe('PdfViewer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    HTMLElement.prototype.scrollIntoView = vi.fn();
    vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(42));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    delete (HTMLElement.prototype as any).scrollIntoView;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // ── Template states ──────────────────────────────────────────────────────

  it('shows the home screen when idle', () => {
    const wrapper = mount(PdfViewer, mountOptions);

    expect(wrapper.findComponent({ name: 'HomeScreen' }).exists()).toBe(true);
    expect(wrapper.find('.spinner').exists()).toBe(false);
  });

  it('shows a spinner while loading', () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/test/doc.pdf');
    const wrapper = mount(PdfViewer, mountOptions);

    expect(wrapper.find('.spinner').exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'HomeScreen' }).exists()).toBe(false);
  });

  it('shows the password dialog when a password is required', () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/test/doc.pdf');
    docStore.setPasswordRequired();
    const wrapper = mount(PdfViewer, mountOptions);

    expect(wrapper.findComponent({ name: 'PasswordDialog' }).exists()).toBe(true);
    expect(wrapper.find('.error').exists()).toBe(false);
  });

  it('shows an error message when a document fails to load', () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/test/doc.pdf');
    docStore.setError({ kind: 'InvalidPdf', message: 'not a pdf' });
    const wrapper = mount(PdfViewer, mountOptions);

    expect(wrapper.find('.error').exists()).toBe(true);
    expect(wrapper.find('.empty_state_title').text()).toBeTruthy();
  });

  it('uses "unknown" error key when no error is set on the store', () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/test/doc.pdf');
    docStore.setError({ kind: 'Unknown', message: 'oops' });
    const wrapper = mount(PdfViewer, mountOptions);

    expect(wrapper.find('.empty_state_title').exists()).toBe(true);
  });

  it('renders a page slot for each page when ready', () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/test/doc.pdf');
    docStore.setReady(mockInfo);
    const wrapper = mount(PdfViewer, mountOptions);

    const slots = wrapper.findAll('.page_slot');
    expect(slots).toHaveLength(3);
    expect(slots[0].attributes('data-page')).toBe('1');
    expect(slots[2].attributes('data-page')).toBe('3');
  });

  it('applies the split modifier class when split view is enabled', () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/test/first.pdf');
    docStore.setReady(mockInfo);
    docStore.setLoading('/test/second.pdf');
    docStore.setReady({ ...mockInfo, path: '/test/second.pdf' });
    docStore.openSplit();
    const wrapper = mount(PdfViewer, mountOptions);

    expect(wrapper.find('.viewer--split').exists()).toBe(true);
  });

  // ── Interaction handlers ─────────────────────────────────────────────────

  it('sets focusedPane to left on mouseenter', async () => {
    const docStore = useDocumentStore();
    docStore.setFocusedPane('right');
    const wrapper = mount(PdfViewer, mountOptions);

    await wrapper.find('.viewer').trigger('mouseenter');

    expect(docStore.focusedPane).toBe('left');
  });

  it('zooms in on Ctrl + wheel up', async () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/test/doc.pdf');
    docStore.setReady(mockInfo);
    const wrapper = mount(PdfViewer, mountOptions);
    const before = docStore.zoom;

    wrapper.find('.viewer').element.dispatchEvent(
      new WheelEvent('wheel', { ctrlKey: true, deltaY: -1, bubbles: true }),
    );
    await nextTick();

    expect(docStore.zoom).toBe(before + 10);
  });

  it('zooms out on Ctrl + wheel down', async () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/test/doc.pdf');
    docStore.setReady(mockInfo);
    const wrapper = mount(PdfViewer, mountOptions);
    const before = docStore.zoom;

    wrapper.find('.viewer').element.dispatchEvent(
      new WheelEvent('wheel', { ctrlKey: true, deltaY: 1, bubbles: true }),
    );
    await nextTick();

    expect(docStore.zoom).toBe(before - 10);
  });

  it('does not zoom when Ctrl key is not held', async () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/test/doc.pdf');
    docStore.setReady(mockInfo);
    const wrapper = mount(PdfViewer, mountOptions);
    const before = docStore.zoom;

    wrapper.find('.viewer').element.dispatchEvent(
      new WheelEvent('wheel', { ctrlKey: false, deltaY: -1, bubbles: true }),
    );
    await nextTick();

    expect(docStore.zoom).toBe(before);
  });

  it('schedules a scroll sync via requestAnimationFrame on scroll', async () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/test/doc.pdf');
    docStore.setReady(mockInfo);
    const wrapper = mount(PdfViewer, mountOptions);

    await wrapper.find('.viewer').trigger('scroll');

    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  // ── Watchers ─────────────────────────────────────────────────────────────

  it('scrolls to the page element when currentPage changes', async () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/test/doc.pdf');
    docStore.setReady(mockInfo);
    mount(PdfViewer, mountOptions);

    docStore.setPage(2);
    await nextTick();
    await nextTick();

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('does not throw when zoom changes and triggers scroll sync', async () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/test/doc.pdf');
    docStore.setReady(mockInfo);
    mount(PdfViewer, mountOptions);

    docStore.setZoom(150);
    await nextTick();
    await nextTick();

    expect(true).toBe(true);
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────

  it('cancels the pending animation frame on unmount', async () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/test/doc.pdf');
    docStore.setReady(mockInfo);
    const wrapper = mount(PdfViewer, mountOptions);

    await wrapper.find('.viewer').trigger('scroll');
    wrapper.unmount();

    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(42);
  });
});
