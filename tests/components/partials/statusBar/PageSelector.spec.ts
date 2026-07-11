import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/document';
import { createTestI18n } from '../../../helpers/testPlugins';
import PageSelector from '@/components/partials/statusBar/PageSelector.vue';
import type { DocumentInfo } from '@/types/pdf';

const mockInfo: DocumentInfo = {
  path: '/test/doc.pdf',
  pageCount: 5,
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

function mountSelector() {
  return mount(PageSelector, {
    global: { plugins: [createTestI18n()] },
  });
}

describe('PageSelector', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('shows the current page and total in the trigger', () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    docStore.setPage(3);
    const wrapper = mountSelector();

    expect(wrapper.find('.page_selector_trigger').text()).toContain('Pag. 3 / 5');
  });

  it('does not show the panel until the trigger is clicked', () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    const wrapper = mountSelector();

    expect(wrapper.find('.page_selector_panel').exists()).toBe(false);
  });

  it('opens the panel when the trigger is clicked', async () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    const wrapper = mountSelector();

    await wrapper.find('.page_selector_trigger').trigger('click');

    expect(wrapper.find('.page_selector_panel').exists()).toBe(true);
  });

  it('closes the panel when the trigger is clicked again', async () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    const wrapper = mountSelector();

    await wrapper.find('.page_selector_trigger').trigger('click');
    await wrapper.find('.page_selector_trigger').trigger('click');

    expect(wrapper.find('.page_selector_panel').exists()).toBe(false);
  });

  it('closes the panel when the overlay is clicked', async () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    const wrapper = mountSelector();

    await wrapper.find('.page_selector_trigger').trigger('click');
    await wrapper.find('.page_selector_overlay').trigger('click');

    expect(wrapper.find('.page_selector_panel').exists()).toBe(false);
  });

  it('jumps to the typed page when the go button is clicked', async () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    const wrapper = mountSelector();

    await wrapper.find('.page_selector_trigger').trigger('click');
    await wrapper.find('.page_selector_input').setValue('4');
    await wrapper.find('.page_selector_go').trigger('click');

    expect(docStore.currentPage).toBe(4);
    expect(wrapper.find('.page_selector_panel').exists()).toBe(false);
  });

  it('jumps to the typed page when Enter is pressed', async () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    const wrapper = mountSelector();

    await wrapper.find('.page_selector_trigger').trigger('click');
    await wrapper.find('.page_selector_input').setValue('2');
    await wrapper.find('.page_selector_input').trigger('keydown.enter');

    expect(docStore.currentPage).toBe(2);
  });

  it('closes the panel when Escape is pressed without changing the page', async () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    docStore.setPage(3);
    const wrapper = mountSelector();

    await wrapper.find('.page_selector_trigger').trigger('click');
    await wrapper.find('.page_selector_input').setValue('5');
    await wrapper.find('.page_selector_input').trigger('keydown.escape');

    expect(wrapper.find('.page_selector_panel').exists()).toBe(false);
    expect(docStore.currentPage).toBe(3);
  });

  it('ignores out-of-bounds page numbers', async () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    docStore.setPage(3);
    const wrapper = mountSelector();

    await wrapper.find('.page_selector_trigger').trigger('click');
    await wrapper.find('.page_selector_input').setValue('99');
    await wrapper.find('.page_selector_go').trigger('click');

    expect(docStore.currentPage).toBe(3);
  });

  describe('with tabId prop', () => {
    let tabId: string;

    beforeEach(() => {
      const docStore = useDocumentStore();
      docStore.setReady(mockInfo);
      tabId = docStore.activeTabId!;
    });

    function mountWithTabId() {
      return mount(PageSelector, {
        global: { plugins: [createTestI18n()] },
        props: { tabId },
      });
    }

    it('shows the tab current page and total in the trigger', () => {
      const docStore = useDocumentStore();
      docStore.setTabPage(tabId, 3);
      const wrapper = mountWithTabId();

      expect(wrapper.find('.page_selector_trigger').text()).toContain('3');
      expect(wrapper.find('.page_selector_trigger').text()).toContain('5');
    });

    it('shows 0 total pages when the tab has no document info yet', () => {
      const docStore = useDocumentStore();
      docStore.newTab();
      const emptyTabId = docStore.activeTabId!;
      const wrapper = mount(PageSelector, {
        global: { plugins: [createTestI18n()] },
        props: { tabId: emptyTabId },
      });

      expect(wrapper.find('.page_selector_trigger').text()).toContain('0');
    });

    it('navigates to the typed page in the specified tab when the go button is clicked', async () => {
      const docStore = useDocumentStore();
      const wrapper = mountWithTabId();

      await wrapper.find('.page_selector_trigger').trigger('click');
      await wrapper.find('.page_selector_input').setValue('4');
      await wrapper.find('.page_selector_go').trigger('click');

      expect(docStore.getTab(tabId)!.currentPage).toBe(4);
    });
  });
});
