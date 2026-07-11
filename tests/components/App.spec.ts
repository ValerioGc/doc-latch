import { describe, it, expect, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/document';
import { createTestI18n } from '../helpers/testPlugins';
import App from '@/App.vue';
import type { DocumentInfo } from '@/types/pdf';

const mockInfo: DocumentInfo = {
  path: '/test/a.pdf',
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

function mountApp() {
  return shallowMount(App, {
    global: { plugins: [createTestI18n()] },
  });
}

function openTwoReadyTabsAndSplit() {
  const docStore = useDocumentStore();
  docStore.setLoading('/test/a.pdf');
  docStore.setReady(mockInfo);
  const aId = docStore.activeTabId!;
  docStore.setLoading('/test/b.pdf');
  docStore.setReady({ ...mockInfo, path: '/test/b.pdf' });
  docStore.setActiveTab(aId);
  docStore.openSplit();
  return docStore;
}

describe('App', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('leftPaneStyle', () => {
    it('applies no inline style to PdfViewer when split is not enabled', () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/test/a.pdf');
      const wrapper = mountApp();

      const viewer = wrapper.findComponent({ name: 'PdfViewer' });
      expect(viewer.attributes('style')).toBeFalsy();
    });

    it('applies no inline style when split is enabled but no resize has occurred', () => {
      openTwoReadyTabsAndSplit();
      const wrapper = mountApp();

      const viewer = wrapper.findComponent({ name: 'PdfViewer' });
      expect(viewer.attributes('style')).toBeFalsy();
    });

    it('applies flex style after a resize drag', async () => {
      openTwoReadyTabsAndSplit();
      const wrapper = mountApp();

      // The pane_divider is rendered when split is active
      const divider = wrapper.find('.pane_divider');
      expect(divider.exists()).toBe(true);

      // Mock getBoundingClientRect on the left-pane element and container
      const dividerEl = divider.element as HTMLElement;
      const leftPaneEl = dividerEl.previousElementSibling as HTMLElement;
      if (leftPaneEl) {
        leftPaneEl.getBoundingClientRect = () => ({
          width: 400,
          height: 0,
          top: 0,
          left: 0,
          right: 400,
          bottom: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        });
      }
      const containerEl = wrapper.find('.app_panes_content').element as HTMLElement;
      containerEl.getBoundingClientRect = () => ({
        width: 900,
        height: 600,
        top: 0,
        left: 0,
        right: 900,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Start drag at x=200, move to x=250 → leftWidth = 400 + 50 = 450
      await divider.trigger('mousedown', { clientX: 200, clientY: 0 });
      globalThis.dispatchEvent(new MouseEvent('mousemove', { clientX: 250, clientY: 0 }));
      await wrapper.vm.$nextTick();

      const viewer = wrapper.findComponent({ name: 'PdfViewer' });
      expect(viewer.attributes('style')).toContain('flex:');
    });

    it('applies the same style to TabBar and PdfViewer', async () => {
      openTwoReadyTabsAndSplit();
      const wrapper = mountApp();

      const divider = wrapper.find('.pane_divider');
      const dividerEl = divider.element as HTMLElement;
      const leftPaneEl = dividerEl.previousElementSibling as HTMLElement;
      if (leftPaneEl) {
        leftPaneEl.getBoundingClientRect = () => ({
          width: 350,
          height: 0,
          top: 0,
          left: 0,
          right: 350,
          bottom: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        });
      }
      const containerEl = wrapper.find('.app_panes_content').element as HTMLElement;
      containerEl.getBoundingClientRect = () => ({
        width: 900,
        height: 600,
        top: 0,
        left: 0,
        right: 900,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      await divider.trigger('mousedown', { clientX: 100, clientY: 0 });
      globalThis.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 0 }));
      await wrapper.vm.$nextTick();

      const viewer = wrapper.findComponent({ name: 'PdfViewer' });
      const tabBar = wrapper.findComponent({ name: 'TabBar' });
      expect(viewer.attributes('style')).toBe(tabBar.attributes('style'));
    });
  });

  describe('splitLeftWidth reset', () => {
    it('resets the pane width when split is closed', async () => {
      const docStore = openTwoReadyTabsAndSplit();
      const wrapper = mountApp();

      // Simulate a resize drag to set a width
      const divider = wrapper.find('.pane_divider');
      const dividerEl = divider.element as HTMLElement;
      const leftPaneEl = dividerEl.previousElementSibling as HTMLElement;
      if (leftPaneEl) {
        leftPaneEl.getBoundingClientRect = () => ({
          width: 400,
          height: 0,
          top: 0,
          left: 0,
          right: 400,
          bottom: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        });
      }
      const containerEl = wrapper.find('.app_panes_content').element as HTMLElement;
      containerEl.getBoundingClientRect = () => ({
        width: 900,
        height: 600,
        top: 0,
        left: 0,
        right: 900,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      await divider.trigger('mousedown', { clientX: 200, clientY: 0 });
      globalThis.dispatchEvent(new MouseEvent('mousemove', { clientX: 250, clientY: 0 }));
      await wrapper.vm.$nextTick();

      // Style must be set now
      expect(wrapper.findComponent({ name: 'PdfViewer' }).attributes('style')).toContain('flex:');

      // Disable split
      docStore.closeSplit();
      await wrapper.vm.$nextTick();

      // Style must be cleared
      expect(wrapper.findComponent({ name: 'PdfViewer' }).attributes('style')).toBeFalsy();
    });
  });

  describe('split pane resize constraints', () => {
    it('clamps the left pane width to SPLIT_MIN (420px) when dragged too far left', async () => {
      openTwoReadyTabsAndSplit();
      const wrapper = mountApp();

      const divider = wrapper.find('.pane_divider');
      const dividerEl = divider.element as HTMLElement;
      const leftPaneEl = dividerEl.previousElementSibling as HTMLElement;
      if (leftPaneEl) {
        leftPaneEl.getBoundingClientRect = () => ({
          width: 400,
          height: 0,
          top: 0,
          left: 0,
          right: 400,
          bottom: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        });
      }
      const containerEl = wrapper.find('.app_panes_content').element as HTMLElement;
      containerEl.getBoundingClientRect = () => ({
        width: 900,
        height: 600,
        top: 0,
        left: 0,
        right: 900,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // Drag far left: 400 + (0 - 500) = -100 → clamped to 420
      await divider.trigger('mousedown', { clientX: 500, clientY: 0 });
      globalThis.dispatchEvent(new MouseEvent('mousemove', { clientX: 0, clientY: 0 }));
      await wrapper.vm.$nextTick();

      const viewer = wrapper.findComponent({ name: 'PdfViewer' });
      expect(viewer.attributes('style')).toContain('420px');
    });

    it('clamps the left pane width to maxWidth when dragged too far right', async () => {
      openTwoReadyTabsAndSplit();
      const wrapper = mountApp();

      const divider = wrapper.find('.pane_divider');
      const dividerEl = divider.element as HTMLElement;
      const leftPaneEl = dividerEl.previousElementSibling as HTMLElement;
      if (leftPaneEl) {
        leftPaneEl.getBoundingClientRect = () => ({
          width: 400,
          height: 0,
          top: 0,
          left: 0,
          right: 400,
          bottom: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        });
      }
      const containerEl = wrapper.find('.app_panes_content').element as HTMLElement;
      containerEl.getBoundingClientRect = () => ({
        width: 900,
        height: 600,
        top: 0,
        left: 0,
        right: 900,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      // containerWidth=900, SPLIT_DIVIDER_WIDTH=6, SPLIT_MIN=420 → maxWidth = 474
      // startWidth=400, startX=100, mousemove to x=900 → 400 + 800 = 1200 → clamped to 474
      await divider.trigger('mousedown', { clientX: 100, clientY: 0 });
      globalThis.dispatchEvent(new MouseEvent('mousemove', { clientX: 900, clientY: 0 }));
      await wrapper.vm.$nextTick();

      const viewer = wrapper.findComponent({ name: 'PdfViewer' });
      expect(viewer.attributes('style')).toContain('474px');
    });

    it('stops updating width after mouseup', async () => {
      openTwoReadyTabsAndSplit();
      const wrapper = mountApp();

      const divider = wrapper.find('.pane_divider');
      const dividerEl = divider.element as HTMLElement;
      const leftPaneEl = dividerEl.previousElementSibling as HTMLElement;
      if (leftPaneEl) {
        leftPaneEl.getBoundingClientRect = () => ({
          width: 400,
          height: 0,
          top: 0,
          left: 0,
          right: 400,
          bottom: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        });
      }
      const containerEl = wrapper.find('.app_panes_content').element as HTMLElement;
      containerEl.getBoundingClientRect = () => ({
        width: 900,
        height: 600,
        top: 0,
        left: 0,
        right: 900,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

      await divider.trigger('mousedown', { clientX: 200, clientY: 0 });
      globalThis.dispatchEvent(new MouseEvent('mousemove', { clientX: 250, clientY: 0 }));
      await wrapper.vm.$nextTick();

      const styleAfterMove = wrapper.findComponent({ name: 'PdfViewer' }).attributes('style');

      globalThis.dispatchEvent(new MouseEvent('mouseup'));
      globalThis.dispatchEvent(new MouseEvent('mousemove', { clientX: 500, clientY: 0 }));
      await wrapper.vm.$nextTick();

      // Style must not have changed after mouseup
      expect(wrapper.findComponent({ name: 'PdfViewer' }).attributes('style')).toBe(styleAfterMove);
    });
  });

  describe('split pane visibility', () => {
    it('does not render the divider when split is not enabled', () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/test/a.pdf');
      const wrapper = mountApp();

      expect(wrapper.find('.pane_divider').exists()).toBe(false);
    });

    it('renders the divider when split is enabled', () => {
      openTwoReadyTabsAndSplit();
      const wrapper = mountApp();

      expect(wrapper.find('.pane_divider').exists()).toBe(true);
    });
  });
});
