import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
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
    expect(tab.find('.split_header_tab-name').text()).toBe('first.pdf');
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
});
