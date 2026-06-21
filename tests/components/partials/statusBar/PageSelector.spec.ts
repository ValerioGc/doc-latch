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

    expect(wrapper.find('.page_selector-trigger').text()).toContain('Pag. 3 / 5');
  });

  it('does not show the panel until the trigger is clicked', () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    const wrapper = mountSelector();

    expect(wrapper.find('.page_selector-panel').exists()).toBe(false);
  });

  it('opens the panel when the trigger is clicked', async () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    const wrapper = mountSelector();

    await wrapper.find('.page_selector-trigger').trigger('click');

    expect(wrapper.find('.page_selector-panel').exists()).toBe(true);
  });

  it('closes the panel when the trigger is clicked again', async () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    const wrapper = mountSelector();

    await wrapper.find('.page_selector-trigger').trigger('click');
    await wrapper.find('.page_selector-trigger').trigger('click');

    expect(wrapper.find('.page_selector-panel').exists()).toBe(false);
  });

  it('closes the panel when the overlay is clicked', async () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    const wrapper = mountSelector();

    await wrapper.find('.page_selector-trigger').trigger('click');
    await wrapper.find('.page_selector-overlay').trigger('click');

    expect(wrapper.find('.page_selector-panel').exists()).toBe(false);
  });

  it('jumps to the typed page when the go button is clicked', async () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    const wrapper = mountSelector();

    await wrapper.find('.page_selector-trigger').trigger('click');
    await wrapper.find('.page_selector-input').setValue('4');
    await wrapper.find('.page_selector-go').trigger('click');

    expect(docStore.currentPage).toBe(4);
    expect(wrapper.find('.page_selector-panel').exists()).toBe(false);
  });

  it('jumps to the typed page when Enter is pressed', async () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    const wrapper = mountSelector();

    await wrapper.find('.page_selector-trigger').trigger('click');
    await wrapper.find('.page_selector-input').setValue('2');
    await wrapper.find('.page_selector-input').trigger('keydown.enter');

    expect(docStore.currentPage).toBe(2);
  });

  it('closes the panel when Escape is pressed without changing the page', async () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    docStore.setPage(3);
    const wrapper = mountSelector();

    await wrapper.find('.page_selector-trigger').trigger('click');
    await wrapper.find('.page_selector-input').setValue('5');
    await wrapper.find('.page_selector-input').trigger('keydown.escape');

    expect(wrapper.find('.page_selector-panel').exists()).toBe(false);
    expect(docStore.currentPage).toBe(3);
  });

  it('ignores out-of-bounds page numbers', async () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    docStore.setPage(3);
    const wrapper = mountSelector();

    await wrapper.find('.page_selector-trigger').trigger('click');
    await wrapper.find('.page_selector-input').setValue('99');
    await wrapper.find('.page_selector-go').trigger('click');

    expect(docStore.currentPage).toBe(3);
  });
});
