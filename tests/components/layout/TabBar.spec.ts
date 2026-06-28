import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/document';
import { createTestI18n } from '../../helpers/testPlugins';
import TabBar from '@/components/layout/TabBar.vue';
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

function mountTabBar() {
  return mount(TabBar, {
    global: { plugins: [createTestI18n()] },
  });
}

describe('TabBar', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders one row per open tab with its file name', () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/path/to/first.pdf');
    docStore.setLoading('/path/to/second.pdf');

    const wrapper = mountTabBar();

    const rows = wrapper.findAll('.tab_row');
    expect(rows).toHaveLength(2);
    expect(rows[0].find('.tab_select_name').text()).toBe('first.pdf');
    expect(rows[1].find('.tab_select_name').text()).toBe('second.pdf');
  });

  it('marks the active tab', () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/path/to/first.pdf');
    docStore.setLoading('/path/to/second.pdf');

    const wrapper = mountTabBar();

    const rows = wrapper.findAll('.tab_row');
    expect(rows[0].classes()).not.toContain('active');
    expect(rows[1].classes()).toContain('active');
  });

  it('switches the active tab when a row is clicked', async () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/path/to/first.pdf');
    const firstTabId = docStore.activeTabId;
    docStore.setLoading('/path/to/second.pdf');
    const wrapper = mountTabBar();

    await wrapper.findAll('.tab_select')[0].trigger('click');

    expect(docStore.activeTabId).toBe(firstTabId);
  });

  it('closes a tab when its close button is clicked', async () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/path/to/first.pdf');
    docStore.setLoading('/path/to/second.pdf');
    const wrapper = mountTabBar();

    await wrapper.findAll('.tab_close')[0].trigger('click');

    expect(docStore.tabs).toHaveLength(1);
    expect(docStore.tabs[0].filePath).toBe('/path/to/second.pdf');
  });

  it('renders nothing when there are no tabs', () => {
    const wrapper = mountTabBar();

    expect(wrapper.findAll('.tab_row')).toHaveLength(0);
  });

  it('opens a new empty tab when the add button is clicked', async () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/path/to/first.pdf');
    const firstTabId = docStore.activeTabId;
    const wrapper = mountTabBar();

    await wrapper.find('.tab_add').trigger('click');

    expect(docStore.tabs).toHaveLength(2);
    expect(docStore.activeTabId).not.toBe(firstTabId);
    expect(docStore.filePath).toBeNull();
  });

  it('shows a placeholder name for an empty new tab', () => {
    const docStore = useDocumentStore();
    docStore.newTab();

    const wrapper = mountTabBar();

    expect(wrapper.find('.tab_select_name').text()).toBe('Nuova scheda');
  });

  it('hides the tab shown in the split pane from the tab list', () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/path/to/first.pdf');
    docStore.setReady(mockInfo);
    const firstTabId = docStore.activeTabId;
    docStore.setLoading('/path/to/second.pdf');
    docStore.setReady({ ...mockInfo, path: '/path/to/second.pdf' });
    docStore.setActiveTab(firstTabId!);
    docStore.openSplit();

    const wrapper = mountTabBar();

    const rows = wrapper.findAll('.tab_row');
    expect(rows).toHaveLength(1);
    expect(rows[0].find('.tab_select_name').text()).toBe('first.pdf');
  });
});
