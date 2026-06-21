import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/document';
import { createTestI18n } from '../../helpers/testPlugins';
import StatusBar from '@/components/layout/StatusBar.vue';
import type { DocumentInfo } from '@/types/pdf';

const mockInfo: DocumentInfo = {
  path: '/test/doc.pdf',
  pageCount: 4,
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

function mountStatusBar() {
  return mount(StatusBar, {
    global: { plugins: [createTestI18n()] },
  });
}

describe('StatusBar', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('shows the "no file" label when no document is open', () => {
    const wrapper = mountStatusBar();

    expect(wrapper.find('.s_item').text()).toContain('Nessun file');
  });

  it('does not show page info or zoom controls when no document is open', () => {
    const wrapper = mountStatusBar();

    expect(wrapper.findAll('.s_item')).toHaveLength(1);
    expect(wrapper.find('.page_selector-trigger').exists()).toBe(false);
    expect(wrapper.find('.zoom').exists()).toBe(false);
  });

  it('shows the file name and page info when a document is open', () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/some/path/document.pdf');
    docStore.setReady(mockInfo);
    docStore.setPage(2);
    const wrapper = mountStatusBar();

    expect(wrapper.find('.s_item').text()).toContain('document.pdf');
    expect(wrapper.find('.page_selector-trigger').text()).toContain('Pag. 2 / 4');
  });

  it('renders zoom controls once a document is open', () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    const wrapper = mountStatusBar();

    expect(wrapper.find('.zoom').exists()).toBe(true);
    expect((wrapper.find('.zoom_select').element as HTMLSelectElement).value).toBe('100');
  });
});
