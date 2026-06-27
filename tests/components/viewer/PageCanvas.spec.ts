import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useUiStore } from '@/stores/ui';
import { useDocumentStore } from '@/stores/document';
import PageCanvas from '@/components/viewer/PageCanvas.vue';
import type { DocumentInfo } from '@/types/pdf';

const renderToCanvas = vi.fn().mockResolvedValue(undefined);
const isLoading = ref(true);

vi.mock('@/composables/usePageCanvas', () => ({
  usePageCanvas: () => ({ isLoading, renderToCanvas }),
}));

const mockInfo: DocumentInfo = {
  path: '/test/doc.pdf',
  pageCount: 1,
  title: null,
  author: null,
  subject: null,
  creator: null,
  producer: null,
  creationDate: null,
  modDate: null,
  pdfVersion: '1.7',
  pageWidthPt: 600,
  pageHeightPt: 800,
  isEncrypted: false,
};

function mountPage(page = 1) {
  return mount(PageCanvas, { props: { page } });
}

describe('PageCanvas', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    isLoading.value = true;
    renderToCanvas.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sizes the box from the page dimensions and the current zoom', () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    const uiStore = useUiStore();
    uiStore.setZoom(100);

    const wrapper = mountPage();

    const style = wrapper.find('.page_canvas').attributes('style');
    expect(style).toContain('width: 600px');
    expect(style).toContain('height: 800px');
  });

  it('halves the box size at 50% zoom', () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    const uiStore = useUiStore();
    uiStore.setZoom(50);

    const wrapper = mountPage();

    const style = wrapper.find('.page_canvas').attributes('style');
    expect(style).toContain('width: 300px');
    expect(style).toContain('height: 400px');
  });

  it('renders the page once on mount', () => {
    useDocumentStore().setReady(mockInfo);
    mountPage(2);

    expect(renderToCanvas).toHaveBeenCalledTimes(1);
    expect(renderToCanvas).toHaveBeenCalledWith(2, 1);
  });

  it('shows the spinner and hides the canvas while loading', () => {
    useDocumentStore().setReady(mockInfo);
    isLoading.value = true;
    const wrapper = mountPage();

    expect(wrapper.find('.page_canvas_spinner').exists()).toBe(true);
    expect(wrapper.find('canvas').classes()).toContain('page_canvas_el--hidden');
  });

  it('hides the spinner and shows the canvas once loaded', () => {
    useDocumentStore().setReady(mockInfo);
    isLoading.value = false;
    const wrapper = mountPage();

    expect(wrapper.find('.page_canvas_spinner').exists()).toBe(false);
    expect(wrapper.find('canvas').classes()).not.toContain('page_canvas_el--hidden');
  });

  it('resizes the box immediately on zoom change, without waiting for the re-render', async () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    const uiStore = useUiStore();
    uiStore.setZoom(100);
    const wrapper = mountPage();
    isLoading.value = false;
    renderToCanvas.mockClear();

    uiStore.setZoom(200);
    await wrapper.vm.$nextTick();

    const style = wrapper.find('.page_canvas').attributes('style');
    expect(style).toContain('width: 1200px');
    expect(style).toContain('height: 1600px');
    expect(isLoading.value).toBe(true);
    expect(renderToCanvas).not.toHaveBeenCalled();
  });

  it('debounces the re-render so rapid zoom changes only trigger one call', async () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    const uiStore = useUiStore();
    mountPage(3);
    renderToCanvas.mockClear();

    uiStore.adjustZoom(10);
    await vi.advanceTimersByTimeAsync(50);
    uiStore.adjustZoom(10);
    await vi.advanceTimersByTimeAsync(50);
    uiStore.adjustZoom(10);
    await vi.advanceTimersByTimeAsync(200);

    expect(renderToCanvas).toHaveBeenCalledTimes(1);
    expect(renderToCanvas).toHaveBeenCalledWith(3, uiStore.zoom / 100);
  });

  it('clears the pending debounce timer on unmount', async () => {
    useDocumentStore().setReady(mockInfo);
    const uiStore = useUiStore();
    const wrapper = mountPage();
    renderToCanvas.mockClear();

    uiStore.adjustZoom(10);
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(200);

    expect(renderToCanvas).not.toHaveBeenCalled();
  });
});
