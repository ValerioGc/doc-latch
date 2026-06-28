import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { usePageCanvas } from '@/composables/usePageCanvas';
import { useDocumentStore } from '@/stores/document';
import { clearPageCache } from '@/composables/usePageRenderCache';

const renderPage = vi.fn();
const renderPageFor = vi.fn();

vi.mock('@/composables/usePdf', () => ({
  usePdf: () => ({ renderPage, renderPageFor }),
}));

const HostWithCanvas = defineComponent({
  setup() {
    return { ...usePageCanvas() };
  },
  template: '<canvas ref="canvas"></canvas>',
});

const HostWithoutCanvas = defineComponent({
  setup() {
    return { ...usePageCanvas() };
  },
  template: '<div></div>',
});

class FakeImage {
  onload: (() => void) | null = null;

  set src(_value: string) {
    this.onload?.();
  }
}

describe('usePageCanvas', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    renderPage.mockReset();
    renderPageFor.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('starts in a loading state', () => {
    const wrapper = mount(HostWithCanvas);

    expect(wrapper.vm.isLoading).toBe(true);
  });

  it('passes a 0-based page index and the given zoom to renderPage', async () => {
    renderPage.mockResolvedValue(null);
    const wrapper = mount(HostWithCanvas);

    await wrapper.vm.renderToCanvas(3, 1.5);

    expect(renderPage).toHaveBeenCalledWith(2, 1.5);
  });

  it('stops loading without drawing when renderPage returns null', async () => {
    renderPage.mockResolvedValue(null);
    const wrapper = mount(HostWithCanvas);

    await wrapper.vm.renderToCanvas(1, 1);

    expect(wrapper.vm.isLoading).toBe(false);
  });

  it('stops loading when there is no canvas element bound', async () => {
    renderPage.mockResolvedValue({ imageBase64: 'abc', widthPx: 10, heightPx: 20 });
    const wrapper = mount(HostWithoutCanvas);

    await wrapper.vm.renderToCanvas(1, 1);

    expect(wrapper.vm.isLoading).toBe(false);
  });

  it('stops loading when the canvas has no 2d context available', async () => {
    renderPage.mockResolvedValue({ imageBase64: 'abc', widthPx: 10, heightPx: 20 });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const wrapper = mount(HostWithCanvas);

    await wrapper.vm.renderToCanvas(1, 1);

    expect(wrapper.vm.isLoading).toBe(false);
  });

  it('draws the rendered image onto the canvas and stops loading', async () => {
    renderPage.mockResolvedValue({ imageBase64: 'abc', widthPx: 42, heightPx: 24 });
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
    vi.stubGlobal('Image', FakeImage);
    const wrapper = mount(HostWithCanvas);

    await wrapper.vm.renderToCanvas(1, 1);

    expect(drawImage).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.isLoading).toBe(false);
    const canvas = wrapper.find('canvas').element as HTMLCanvasElement;
    expect(canvas.width).toBe(42);
    expect(canvas.height).toBe(24);
  });

  describe('page cache', () => {
    beforeEach(() => {
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
      vi.stubGlobal('Image', FakeImage);
      renderPage.mockResolvedValue({ imageBase64: 'abc', widthPx: 10, heightPx: 20 });
    });

    it('reuses the cached page for the same tab, page and zoom instead of re-rendering', async () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/a.pdf');

      const first = mount(HostWithCanvas);
      await first.vm.renderToCanvas(1, 1);
      first.unmount();

      const second = mount(HostWithCanvas);
      await second.vm.renderToCanvas(1, 1);

      expect(renderPage).toHaveBeenCalledTimes(1);
    });

    it('re-renders when the zoom is different', async () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/a.pdf');
      const wrapper = mount(HostWithCanvas);

      await wrapper.vm.renderToCanvas(1, 1);
      await wrapper.vm.renderToCanvas(1, 2);

      expect(renderPage).toHaveBeenCalledTimes(2);
    });

    it('keys the cache by tab so different tabs do not collide', async () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/a.pdf');
      const first = mount(HostWithCanvas);
      await first.vm.renderToCanvas(1, 1);

      docStore.setLoading('/b.pdf');
      const second = mount(HostWithCanvas);
      await second.vm.renderToCanvas(1, 1);

      expect(renderPage).toHaveBeenCalledTimes(2);
    });

    it('keeps separate cache entries per zoom, so a thumbnail render does not evict the full-page one', async () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/a.pdf');
      const wrapper = mount(HostWithCanvas);

      await wrapper.vm.renderToCanvas(1, 1); // full-page zoom
      await wrapper.vm.renderToCanvas(1, 0.5); // thumbnail zoom, same tab+page
      await wrapper.vm.renderToCanvas(1, 1); // back to full-page zoom — should still be cached

      expect(renderPage).toHaveBeenCalledTimes(2);
    });

    it('clearPageCache evicts entries so a re-opened tab renders again', async () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/a.pdf');
      const tabId = docStore.activeTabId!;
      const first = mount(HostWithCanvas);
      await first.vm.renderToCanvas(1, 1);

      clearPageCache(tabId);

      const second = mount(HostWithCanvas);
      await second.vm.renderToCanvas(1, 1);

      expect(renderPage).toHaveBeenCalledTimes(2);
    });
  });
});
