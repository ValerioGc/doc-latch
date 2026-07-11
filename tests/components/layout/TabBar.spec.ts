import { describe, it, expect, beforeEach, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { startTabDrag, simulateDrop, useDragState, endTabDrag } from '@/composables/useTabDrag';
import { useDocumentStore } from '@/stores/document';
import { createTestI18n } from '../../helpers/testPlugins';
import TabBar from '@/components/layout/TabBar.vue';
import type { DocumentInfo } from '@/types/pdf';

const mockInfo: DocumentInfo = {
  path: '/path/to/first.pdf',
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

function mountTabBar() {
  return mount(TabBar, {
    global: { plugins: [createTestI18n()] },
  });
}

describe('TabBar', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders one row per open tab with its file name', () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/path/to/first.pdf');
    docStore.setLoading('/path/to/second.pdf');

    const wrapper = mountTabBar();

    const rows = wrapper.findAll('.tab_row');
    expect(rows).toHaveLength(2);
    expect(rows[0].find('.tab_select_name').text()).toBe('first.pdf');
    expect(rows[1].find('.tab_select_name').text()).toBe('second.pdf');
  });

  it('marks the active tab', () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/path/to/first.pdf');
    docStore.setLoading('/path/to/second.pdf');

    const wrapper = mountTabBar();

    const rows = wrapper.findAll('.tab_row');
    expect(rows[0].classes()).not.toContain('active');
    expect(rows[1].classes()).toContain('active');
  });

  it('switches the active tab when a row is clicked', async () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/path/to/first.pdf');
    const firstTabId = docStore.activeTabId;
    docStore.setLoading('/path/to/second.pdf');
    const wrapper = mountTabBar();

    await wrapper.findAll('.tab_select')[0].trigger('click');

    expect(docStore.activeTabId).toBe(firstTabId);
  });

  it('closes a tab when its close button is clicked', async () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/path/to/first.pdf');
    docStore.setLoading('/path/to/second.pdf');
    const wrapper = mountTabBar();

    await wrapper.findAll('.tab_close')[0].trigger('click');

    expect(docStore.tabs).toHaveLength(1);
    expect(docStore.tabs[0].filePath).toBe('/path/to/second.pdf');
  });

  it('renders nothing when there are no tabs', () => {
    const wrapper = mountTabBar();

    expect(wrapper.findAll('.tab_row')).toHaveLength(0);
  });

  it('opens a new empty tab when the add button is clicked', async () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/path/to/first.pdf');
    const firstTabId = docStore.activeTabId;
    const wrapper = mountTabBar();

    await wrapper.find('.tab_add').trigger('click');

    expect(docStore.tabs).toHaveLength(2);
    expect(docStore.activeTabId).not.toBe(firstTabId);
    expect(docStore.filePath).toBeNull();
  });

  it('shows a placeholder name for an empty new tab', () => {
    const docStore = useDocumentStore();
    docStore.newTab();

    const wrapper = mountTabBar();

    expect(wrapper.find('.tab_select_name').text()).toBe('Nuova scheda');
  });

  describe('drag-and-drop tab swapping', () => {
    function openSplitSetup() {
      const docStore = useDocumentStore();
      docStore.setLoading('/path/to/first.pdf');
      docStore.setReady(mockInfo);
      const firstTabId = docStore.activeTabId!;
      docStore.setLoading('/path/to/second.pdf');
      docStore.setReady({ ...mockInfo, path: '/path/to/second.pdf' });
      const secondTabId = docStore.activeTabId!;
      docStore.setActiveTab(firstTabId);
      docStore.openSplit();
      // activeTabId = firstTabId (left), splitTabId = secondTabId (right)
      return { docStore, firstTabId, secondTabId };
    }

    it('each tab row has a pointer drag handle', () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/path/to/first.pdf');
      docStore.setLoading('/path/to/second.pdf');
      const wrapper = mountTabBar();

      const handles = wrapper.findAll('[data-drag-handle]');
      expect(handles).toHaveLength(2);
    });

    it('each tab row carries its tab id as a data attribute', () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/path/to/first.pdf');
      const id = docStore.activeTabId!;
      const wrapper = mountTabBar();

      expect(wrapper.find('.tab_row').attributes('data-tab-id')).toBe(id);
    });

    it('swaps tabs when the split pane tab is dropped onto a tab row', () => {
      const { docStore, firstTabId, secondTabId } = openSplitSetup();

      startTabDrag(secondTabId, 'second.pdf', { clientX: 0, clientY: 0 } as PointerEvent);
      simulateDrop('tab');

      expect(docStore.activeTabId).toBe(secondTabId);
      expect(docStore.splitTabId).toBe(firstTabId);
    });

    it('does not swap when an unrelated id is active drag', () => {
      const { docStore, firstTabId } = openSplitSetup();

      startTabDrag('unknown-id', '', { clientX: 0, clientY: 0 } as PointerEvent);
      simulateDrop('tab');

      expect(docStore.activeTabId).toBe(firstTabId);
    });

    it('reorders tabs when a non-split tab is dropped on another tab', () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/path/to/first.pdf');
      const firstTabId = docStore.activeTabId!;
      docStore.setLoading('/path/to/second.pdf');
      const secondTabId = docStore.activeTabId!;
      docStore.setLoading('/path/to/third.pdf');
      const thirdTabId = docStore.activeTabId!;

      startTabDrag(thirdTabId, 'third.pdf', { clientX: 0, clientY: 0 } as PointerEvent);
      simulateDrop('tab', firstTabId); // move third before first

      expect(docStore.tabs[0].id).toBe(thirdTabId);
      expect(docStore.tabs[1].id).toBe(firstTabId);
      expect(docStore.tabs[2].id).toBe(secondTabId);
    });
  });

  describe('onPointerDown drag handle', () => {
    beforeEach(() => {
      endTabDrag();
    });

    it('does not start a drag when a non-primary button is pressed', async () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/path/to/first.pdf');
      const wrapper = mountTabBar();
      const state = useDragState();

      const handle = wrapper.find('[data-drag-handle]');
      handle.element.dispatchEvent(new PointerEvent('pointerdown', { button: 2, bubbles: true }));
      await nextTick();

      expect(state.tabId).toBeNull();
    });

    it('starts a drag on primary button press', async () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/path/to/first.pdf');
      const tabId = docStore.activeTabId!;
      const wrapper = mountTabBar();
      const state = useDragState();

      const handle = wrapper.find('[data-drag-handle]');
      (handle.element as HTMLElement).setPointerCapture = vi.fn();
      handle.element.dispatchEvent(new PointerEvent('pointerdown', { button: 0, pointerId: 1, bubbles: true }));
      await nextTick();

      expect(state.tabId).toBe(tabId);
      endTabDrag();
    });
  });

  it('hides the tab shown in the split pane from the tab list', () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/path/to/first.pdf');
    docStore.setReady(mockInfo);
    const firstTabId = docStore.activeTabId;
    docStore.setLoading('/path/to/second.pdf');
    docStore.setReady({ ...mockInfo, path: '/path/to/second.pdf' });
    docStore.setActiveTab(firstTabId!);
    docStore.openSplit();

    const wrapper = mountTabBar();

    const rows = wrapper.findAll('.tab_row');
    expect(rows).toHaveLength(1);
    expect(rows[0].find('.tab_select_name').text()).toBe('first.pdf');
  });
});
