import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/document';
import { createTestI18n } from '../../../helpers/testPlugins';
import ZoomControls from '@/components/partials/statusBar/ZoomControls.vue';
import type { DocumentInfo } from '@/types/pdf';

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

function mountComponent() {
  return mount(ZoomControls, {
    global: { plugins: [createTestI18n()] },
  });
}

describe('ZoomControls', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    useDocumentStore().setLoading('/test/doc.pdf');
  });

  it('decreases the zoom when the zoom-out button is clicked', async () => {
    const docStore = useDocumentStore();
    docStore.setZoom(100);
    const wrapper = mountComponent();

    await wrapper.findAll('.zoom_btn')[0].trigger('click');

    expect(docStore.zoom).toBe(90);
  });

  it('increases the zoom when the zoom-in button is clicked', async () => {
    const docStore = useDocumentStore();
    docStore.setZoom(100);
    const wrapper = mountComponent();

    await wrapper.findAll('.zoom_btn')[1].trigger('click');

    expect(docStore.zoom).toBe(110);
  });

  it('resets the zoom to 100 when the reset button is clicked', async () => {
    const docStore = useDocumentStore();
    docStore.setZoom(200);
    const wrapper = mountComponent();

    await wrapper.findAll('.zoom_btn')[2].trigger('click');

    expect(docStore.zoom).toBe(100);
  });

  it('disables the reset button once zoom is already 100', () => {
    const docStore = useDocumentStore();
    docStore.setZoom(100);
    const wrapper = mountComponent();

    expect(wrapper.findAll('.zoom_btn')[2].attributes('disabled')).toBeDefined();
  });

  it('shows only the preset zoom options when the current zoom is a preset', () => {
    const docStore = useDocumentStore();
    docStore.setZoom(150);
    const wrapper = mountComponent();

    const options = wrapper.findAll('option').map((o) => o.text());
    expect(options).toEqual(['50%', '75%', '100%', '125%', '150%', '200%', '300%', '400%']);
  });

  it('injects the current zoom into the option list when it is not a preset', () => {
    const docStore = useDocumentStore();
    docStore.setZoom(110);
    const wrapper = mountComponent();

    const options = wrapper.findAll('option').map((o) => o.text());
    expect(options).toContain('110%');
    expect(options.indexOf('100%')).toBeLessThan(options.indexOf('110%'));
    expect(options.indexOf('110%')).toBeLessThan(options.indexOf('125%'));
  });

  it('changes the zoom when a new option is selected', async () => {
    const docStore = useDocumentStore();
    docStore.setZoom(100);
    const wrapper = mountComponent();

    await wrapper.find('.zoom_select').setValue('200');

    expect(docStore.zoom).toBe(200);
  });

  describe('with tabId prop', () => {
    let tabId: string;

    beforeEach(() => {
      const docStore = useDocumentStore();
      docStore.setLoading('/test/doc.pdf');
      docStore.setReady(mockInfo);
      tabId = docStore.activeTabId!;
    });

    function mountWithTabId() {
      return mount(ZoomControls, {
        global: { plugins: [createTestI18n()] },
        props: { tabId },
      });
    }

    it('decreases the tab zoom when the zoom-out button is clicked', async () => {
      const docStore = useDocumentStore();
      docStore.setTabZoom(tabId, 100);
      const wrapper = mountWithTabId();

      await wrapper.findAll('.zoom_btn')[0].trigger('click');

      expect(docStore.getTab(tabId)!.zoom).toBe(90);
    });

    it('increases the tab zoom when the zoom-in button is clicked', async () => {
      const docStore = useDocumentStore();
      docStore.setTabZoom(tabId, 100);
      const wrapper = mountWithTabId();

      await wrapper.findAll('.zoom_btn')[1].trigger('click');

      expect(docStore.getTab(tabId)!.zoom).toBe(110);
    });

    it('resets the tab zoom to 100 when the reset button is clicked', async () => {
      const docStore = useDocumentStore();
      docStore.setTabZoom(tabId, 200);
      const wrapper = mountWithTabId();

      await wrapper.findAll('.zoom_btn')[2].trigger('click');

      expect(docStore.getTab(tabId)!.zoom).toBe(100);
    });

    it('changes the tab zoom when a new option is selected from the dropdown', async () => {
      const docStore = useDocumentStore();
      docStore.setTabZoom(tabId, 100);
      const wrapper = mountWithTabId();

      await wrapper.find('.zoom_select').setValue('150');

      expect(docStore.getTab(tabId)!.zoom).toBe(150);
    });
  });
});
