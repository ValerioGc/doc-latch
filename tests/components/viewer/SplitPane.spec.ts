import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/document';
import SplitPane from '@/components/viewer/SplitPane.vue';
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

describe('SplitPane', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders a page canvas per page of the selected tab', () => {
    openTwoReadyTabsAndSplit();
    const wrapper = mount(SplitPane);

    expect(wrapper.findAll('.page_slot')).toHaveLength(2);
  });

  it('renders nothing when no tab is shown in the split pane', () => {
    setActivePinia(createPinia());
    const wrapper = mount(SplitPane);

    expect(wrapper.findAll('.page_slot')).toHaveLength(0);
  });
});
