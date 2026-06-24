import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import ThumbCanvas from '@/components/viewer/ThumbCanvas.vue';

const renderToCanvas = vi.fn().mockResolvedValue(undefined);
const isLoading = ref(true);

vi.mock('@/composables/usePageCanvas', () => ({
  usePageCanvas: () => ({ isLoading, renderToCanvas }),
}));

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  disconnect = vi.fn();
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  observe(): void {}

  trigger(isIntersecting: boolean): void {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

describe('ThumbCanvas', () => {
  beforeEach(() => {
    isLoading.value = true;
    renderToCanvas.mockClear();
    FakeIntersectionObserver.instances = [];
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the placeholder while loading', () => {
    const wrapper = mount(ThumbCanvas, { props: { page: 1 } });

    expect(wrapper.find('.thumb_canvas_placeholder').exists()).toBe(true);
    expect(wrapper.find('canvas').classes()).toContain('thumb_canvas_el--hidden');
  });

  it('hides the placeholder once loaded', () => {
    isLoading.value = false;
    const wrapper = mount(ThumbCanvas, { props: { page: 1 } });

    expect(wrapper.find('.thumb_canvas_placeholder').exists()).toBe(false);
    expect(wrapper.find('canvas').classes()).not.toContain('thumb_canvas_el--hidden');
  });

  it('observes the root element on mount', () => {
    mount(ThumbCanvas, { props: { page: 2 } });

    expect(FakeIntersectionObserver.instances).toHaveLength(1);
  });

  it('renders the page once it intersects the viewport', () => {
    mount(ThumbCanvas, { props: { page: 4 } });

    FakeIntersectionObserver.instances[0].trigger(true);

    expect(renderToCanvas).toHaveBeenCalledWith(4, 0.18);
  });

  it('does not render when the entry is not intersecting', () => {
    mount(ThumbCanvas, { props: { page: 4 } });

    FakeIntersectionObserver.instances[0].trigger(false);

    expect(renderToCanvas).not.toHaveBeenCalled();
  });

  it('only renders once even if intersection fires multiple times', () => {
    mount(ThumbCanvas, { props: { page: 4 } });
    const observer = FakeIntersectionObserver.instances[0];

    observer.trigger(true);
    observer.trigger(true);

    expect(renderToCanvas).toHaveBeenCalledTimes(1);
  });

  it('disconnects the observer on unmount', () => {
    const wrapper = mount(ThumbCanvas, { props: { page: 1 } });
    const observer = FakeIntersectionObserver.instances[0];

    wrapper.unmount();

    expect(observer.disconnect).toHaveBeenCalledTimes(1);
  });
});
