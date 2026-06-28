import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/document';
import { createTestI18n } from '../../helpers/testPlugins';
import SplitToggle from '@/components/layout/SplitToggle.vue';
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

function mountToggle() {
  return mount(SplitToggle, {
    global: { plugins: [createTestI18n()] },
  });
}

describe('SplitToggle', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('disables the button with fewer than two ready tabs', () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/path/to/first.pdf');
    docStore.setReady(mockInfo);

    const wrapper = mountToggle();

    expect(wrapper.find('.split_toggle').attributes('disabled')).toBeDefined();
  });

  it('toggles the split pane when clicked', async () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/path/to/first.pdf');
    docStore.setReady(mockInfo);
    docStore.setLoading('/path/to/second.pdf');
    docStore.setReady({ ...mockInfo, path: '/path/to/second.pdf' });
    const wrapper = mountToggle();

    const button = wrapper.find('.split_toggle');
    expect(button.attributes('disabled')).toBeUndefined();

    await button.trigger('click');
    expect(docStore.splitEnabled).toBe(true);
    expect(button.classes()).toContain('active');

    await button.trigger('click');
    expect(docStore.splitEnabled).toBe(false);
  });
});
