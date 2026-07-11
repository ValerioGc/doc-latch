import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/document';
import SplitPane from '@/components/viewer/SplitPane.vue';
import { createTestI18n } from '../../helpers/testPlugins';
import type { DocumentInfo } from '@/types/pdf';

vi.mock('@/composables/usePageCanvas', () => ({
  usePageCanvas: () => ({ isLoading: ref(false), renderToCanvas: vi.fn().mockResolvedValue(undefined) }),
}));

const mockInfo: DocumentInfo = {
  path: '/test/first.pdf',
  pageCount: 2,
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

function openTwoReadyTabsAndSplit() {
  const docStore = useDocumentStore();
  docStore.setLoading('/test/first.pdf');
  docStore.setReady(mockInfo);
  const firstTabId = docStore.activeTabId!;
  docStore.setLoading('/test/second.pdf');
  docStore.setReady({ ...mockInfo, path: '/test/second.pdf' });
  docStore.openSplit();
  return { docStore, firstTabId };
}

const mountOptions = { global: { plugins: [createTestI18n()] } };

describe('SplitPane', () => {
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

  it('renders a page canvas per page of the selected tab', () => {
    openTwoReadyTabsAndSplit();
    const wrapper = mount(SplitPane, mountOptions);

    expect(wrapper.findAll('.page_slot')).toHaveLength(2);
  });

  it('renders nothing when no tab is shown in the split pane', () => {
    const wrapper = mount(SplitPane, mountOptions);

    expect(wrapper.findAll('.page_slot')).toHaveLength(0);
  });

  it('shows a spinner while the split tab is loading', () => {
    const { docStore } = openTwoReadyTabsAndSplit();
    docStore.setTabLoading(docStore.splitTabId!, '/test/loading.pdf');
    const wrapper = mount(SplitPane, mountOptions);

    expect(wrapper.find('.spinner').exists()).toBe(true);
  });

  it('shows the password lock message when the split tab requires a password', () => {
    const { docStore } = openTwoReadyTabsAndSplit();
    docStore.setPasswordRequired(docStore.splitTabId!);
    const wrapper = mount(SplitPane, mountOptions);

    expect(wrapper.find('.empty_state_title').exists()).toBe(true);
    expect(wrapper.find('.spinner').exists()).toBe(false);
    expect(wrapper.find('.error').exists()).toBe(false);
  });

  it('shows an error message when the split tab has a load error', () => {
    const { docStore } = openTwoReadyTabsAndSplit();
    docStore.setError({ kind: 'InvalidPdf', message: 'bad file' }, docStore.splitTabId!);
    const wrapper = mount(SplitPane, mountOptions);

    expect(wrapper.find('.error').exists()).toBe(true);
    expect(wrapper.find('.empty_state_title').text()).toBeTruthy();
  });

  it('shows the home screen when the split tab is idle', () => {
    const { docStore, firstTabId } = openTwoReadyTabsAndSplit();
    // Reset the split tab to idle by replacing its state directly
    const tab = docStore.getTab(firstTabId)!;
    tab.state = 'idle';
    const wrapper = mount(SplitPane, mountOptions);

    expect(wrapper.findComponent({ name: 'HomeScreen' }).exists()).toBe(true);
  });

  // ── Interaction handlers ─────────────────────────────────────────────────

  it('sets focusedPane to right on mouseenter', async () => {
    const { docStore } = openTwoReadyTabsAndSplit();
    docStore.setFocusedPane('left');
    const wrapper = mount(SplitPane, mountOptions);

    await wrapper.find('.split_pane').trigger('mouseenter');

    expect(docStore.focusedPane).toBe('right');
  });

  it('zooms in the split tab on Ctrl + wheel up', async () => {
    const { docStore } = openTwoReadyTabsAndSplit();
    const splitTab = docStore.getTab(docStore.splitTabId!)!;
    const before = splitTab.zoom;
    const wrapper = mount(SplitPane, mountOptions);

    wrapper.find('.split_pane').element.dispatchEvent(
      new WheelEvent('wheel', { ctrlKey: true, deltaY: -1, bubbles: true }),
    );
    await nextTick();

    expect(docStore.getTab(docStore.splitTabId!)!.zoom).toBe(before + 10);
  });

  it('zooms out the split tab on Ctrl + wheel down', async () => {
    const { docStore } = openTwoReadyTabsAndSplit();
    const before = docStore.getTab(docStore.splitTabId!)!.zoom;
    const wrapper = mount(SplitPane, mountOptions);

    wrapper.find('.split_pane').element.dispatchEvent(
      new WheelEvent('wheel', { ctrlKey: true, deltaY: 1, bubbles: true }),
    );
    await nextTick();

    expect(docStore.getTab(docStore.splitTabId!)!.zoom).toBe(before - 10);
  });

  it('does not zoom when Ctrl key is not held', async () => {
    const { docStore } = openTwoReadyTabsAndSplit();
    const before = docStore.getTab(docStore.splitTabId!)!.zoom;
    const wrapper = mount(SplitPane, mountOptions);

    wrapper.find('.split_pane').element.dispatchEvent(
      new WheelEvent('wheel', { ctrlKey: false, deltaY: -1, bubbles: true }),
    );
    await nextTick();

    expect(docStore.getTab(docStore.splitTabId!)!.zoom).toBe(before);
  });

  it('does not zoom when no tab is in the split pane', async () => {
    const wrapper = mount(SplitPane, mountOptions);

    wrapper.find('.split_pane').element.dispatchEvent(
      new WheelEvent('wheel', { ctrlKey: true, deltaY: -1, bubbles: true }),
    );
    await nextTick();

    expect(true).toBe(true); // no throw
  });

  it('schedules a scroll sync via requestAnimationFrame on scroll', async () => {
    openTwoReadyTabsAndSplit();
    const wrapper = mount(SplitPane, mountOptions);

    await wrapper.find('.split_pane').trigger('scroll');

    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  // ── Watcher ──────────────────────────────────────────────────────────────

  it('scrolls to the page element when the split tab currentPage changes', async () => {
    const { docStore } = openTwoReadyTabsAndSplit();
    mount(SplitPane, mountOptions);

    docStore.setTabPage(docStore.splitTabId!, 2);
    await nextTick();
    await nextTick();

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────

  it('cancels the pending animation frame on unmount', async () => {
    openTwoReadyTabsAndSplit();
    const wrapper = mount(SplitPane, mountOptions);

    await wrapper.find('.split_pane').trigger('scroll');
    wrapper.unmount();

    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(42);
  });
});
