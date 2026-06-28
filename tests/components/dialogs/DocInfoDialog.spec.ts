import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/document';
import { createTestI18n } from '../../helpers/testPlugins';
import DocInfoDialog from '@/components/dialogs/info/DocInfoDialog.vue';
import type { DocumentInfo } from '@/types/pdf';

const fullInfo: DocumentInfo = {
  path: '/test/doc.pdf',
  pageCount: 5,
  title: 'Test Doc',
  author: 'Author',
  subject: 'Subject',
  creator: 'Creator',
  producer: 'Producer',
  creationDate: '2024-01-01',
  modDate: '2024-02-01',
  pdfVersion: '1.7',
  pageWidthPt: 595,
  pageHeightPt: 842,
  isEncrypted: true,
};

function mountDialog() {
  return mount(DocInfoDialog, {
    global: { plugins: [createTestI18n()] },
  });
}

describe('DocInfoDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the document info fields', () => {
    const docStore = useDocumentStore();
    docStore.setReady(fullInfo);
    const wrapper = mountDialog();

    expect(wrapper.find('.info').text()).toContain('/test/doc.pdf');
    expect(wrapper.find('.info').text()).toContain('Test Doc');
    expect(wrapper.find('.info').text()).toContain('Author');
    expect(wrapper.find('.info').text()).toContain('1.7');
    expect(wrapper.find('.info').text()).toContain('595 × 842 pt');
  });

  it('shows "yes" for encrypted documents', () => {
    const docStore = useDocumentStore();
    docStore.setReady(fullInfo);
    const wrapper = mountDialog();

    expect(wrapper.find('.info').text()).toContain('Sì');
  });

  it('shows "no" for non-encrypted documents', () => {
    const docStore = useDocumentStore();
    docStore.setReady({ ...fullInfo, isEncrypted: false });
    const wrapper = mountDialog();

    expect(wrapper.find('.info').text()).toContain('No');
  });

  it('falls back to "N/D" for missing optional fields', () => {
    const docStore = useDocumentStore();
    docStore.setReady({ ...fullInfo, subject: null, creator: null, producer: null });
    const wrapper = mountDialog();

    const notAvailableCount = wrapper.find('.info').text().match(/N\/D/g) ?? [];
    expect(notAvailableCount.length).toBe(3);
  });

  it('renders no rows when there is no document info', () => {
    const wrapper = mountDialog();

    expect(wrapper.findAll('.info_label')).toHaveLength(0);
  });

  it('emits close when the close button is clicked', async () => {
    const wrapper = mountDialog();

    await wrapper.find('.btn_primary').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
