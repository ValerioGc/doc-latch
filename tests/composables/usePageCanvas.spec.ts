import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { usePageCanvas } from '@/composables/usePageCanvas';

const renderPage = vi.fn();

vi.mock('@/composables/usePdf', () => ({
  usePdf: () => ({ renderPage }),
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
    renderPage.mockReset();
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
});
