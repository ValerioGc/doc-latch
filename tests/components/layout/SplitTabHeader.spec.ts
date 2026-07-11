import { describe, it, expect, beforeEach, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { startTabDrag, endTabDrag, simulateDrop, useDragState } from '@/composables/useTabDrag';
import { useDocumentStore } from '@/stores/document';
import { createTestI18n } from '../../helpers/testPlugins';
import SplitTabHeader from '@/components/layout/SplitTabHeader.vue';
import type { DocumentInfo } from '@/types/pdf';

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

function mountHeader() {
  return mount(SplitTabHeader, {
    global: { plugins: [createTestI18n()] },
  });
}

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

describe('SplitTabHeader', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the tab shown in the split pane', () => {
    const { docStore, firstTabId } = openTwoReadyTabsAndSplit();
    expect(docStore.splitTabId).toBe(firstTabId);
    const wrapper = mountHeader();

    const tab = wrapper.find('.split_header_tab');
    expect(tab.exists()).toBe(true);
    expect(tab.find('.split_header_tab_name').text()).toBe('first.pdf');
  });

  it('renders nothing when there is no split tab', () => {
    setActivePinia(createPinia());
    const wrapper = mountHeader();

    expect(wrapper.find('.split_header_tab').exists()).toBe(false);
  });

  it('closes the tab (and the split pane with it) when the close button is clicked', async () => {
    const { docStore, firstTabId } = openTwoReadyTabsAndSplit();
    const wrapper = mountHeader();

    await wrapper.find('.split_header_close').trigger('click');

    expect(docStore.getTab(firstTabId)).toBeNull();
    expect(docStore.splitEnabled).toBe(false);
  });

  it('shows the placeholder name when the split tab has no file loaded', () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/test/first.pdf');
    docStore.setReady(mockInfo);
    const firstTabId = docStore.activeTabId!;
    docStore.newTab(); // idle tab B (filePath === null), now active
    docStore.setActiveTab(firstTabId); // make first.pdf active again
    docStore.openSplit(); // idle tab B becomes split tab

    const wrapper = mountHeader();

    expect(wrapper.find('.split_header_tab_name').text()).toBe('Nuova scheda');
  });

  describe('onPointerDown drag handle', () => {
    it('does not start a drag when a non-primary button is pressed', async () => {
      openTwoReadyTabsAndSplit();
      const wrapper = mountHeader();
      const state = useDragState();

      const handle = wrapper.find('[data-drag-handle]');
      handle.element.dispatchEvent(new PointerEvent('pointerdown', { button: 2, bubbles: true }));
      await nextTick();

      expect(state.tabId).toBeNull();
    });

    it('starts a drag on primary button press', async () => {
      const { firstTabId } = openTwoReadyTabsAndSplit();
      const wrapper = mountHeader();
      const state = useDragState();

      const handle = wrapper.find('[data-drag-handle]');
      handle.element.dispatchEvent(new PointerEvent('pointerdown', { button: 0, pointerId: 1, bubbles: true }));
      await nextTick();

      expect(state.tabId).toBe(firstTabId);
      endTabDrag();
    });
  });

  describe('drag-and-drop tab swapping', () => {
    it('has a pointer drag handle', () => {
      openTwoReadyTabsAndSplit();
      const wrapper = mountHeader();

      expect(wrapper.find('[data-drag-handle]').exists()).toBe(true);
    });

    it('swaps tabs when a main-pane tab is dropped onto the header', () => {
      const { docStore, firstTabId } = openTwoReadyTabsAndSplit();
      const secondTabId = docStore.activeTabId!;

      startTabDrag(secondTabId, 'second.pdf', { clientX: 0, clientY: 0 } as PointerEvent);
      simulateDrop('split');

      expect(docStore.activeTabId).toBe(firstTabId);
      expect(docStore.splitTabId).toBe(secondTabId);
    });

    it('does not swap when the split tab itself is the active drag', () => {
      const { docStore, firstTabId } = openTwoReadyTabsAndSplit();

      startTabDrag(firstTabId, 'first.pdf', { clientX: 0, clientY: 0 } as PointerEvent);
      simulateDrop('split');

      expect(docStore.splitTabId).toBe(firstTabId);
      endTabDrag();
    });
  });
});
