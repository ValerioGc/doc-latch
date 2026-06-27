import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/document';
import { useUiStore } from '@/stores/ui';
import { createTestI18n } from '../../helpers/testPlugins';
import Sidebar from '@/components/layout/Sidebar.vue';
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

function mountSidebar() {
  return mount(Sidebar, {
    global: {
      plugins: [createTestI18n()],
      stubs: { ThumbCanvas: true },
    },
  });
}

describe('Sidebar', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('shows the empty placeholder when no document is open', () => {
    const wrapper = mountSidebar();

    expect(wrapper.find('.empty-sidebar').exists()).toBe(true);
    expect(wrapper.findAll('.thumb')).toHaveLength(0);
  });

  it('renders one thumbnail per page once a document is open', () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    const wrapper = mountSidebar();

    expect(wrapper.findAll('.thumb')).toHaveLength(3);
    expect(wrapper.find('.empty-sidebar').exists()).toBe(false);
  });

  it('marks the current page thumbnail as active', () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    docStore.setPage(2);
    const wrapper = mountSidebar();

    const thumbs = wrapper.findAll('.thumb');
    expect(thumbs[0].classes()).not.toContain('active');
    expect(thumbs[1].classes()).toContain('active');
  });

  it('changes the current page when a thumbnail is clicked', async () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    const wrapper = mountSidebar();

    await wrapper.findAll('.thumb')[2].trigger('click');

    expect(docStore.currentPage).toBe(3);
  });

  it('scrolls the active thumbnail into view when the page changes from outside the sidebar', async () => {
    const docStore = useDocumentStore();
    docStore.setReady(mockInfo);
    const wrapper = mountSidebar();
    const target = wrapper.findAll('.thumb')[2].element as HTMLElement;
    const scrollSpy = vi.fn();
    target.scrollIntoView = scrollSpy;

    docStore.setPage(3);
    await flushPromises();

    expect(scrollSpy).toHaveBeenCalledWith({ block: 'nearest' });
  });

  it('toggles sidebarCollapsed when the rail toggle is clicked', async () => {
    const uiStore = useUiStore();
    const wrapper = mountSidebar();

    expect(uiStore.sidebarCollapsed).toBe(false);
    await wrapper.find('.sidebar-toggle').trigger('click');
    expect(uiStore.sidebarCollapsed).toBe(true);
  });

  it('hides the resize handle when the sidebar is collapsed', async () => {
    const uiStore = useUiStore();
    const wrapper = mountSidebar();

    expect(wrapper.find('.sidebar-resize').exists()).toBe(true);
    uiStore.toggleSidebar();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.sidebar-resize').exists()).toBe(false);
  });

  it('resizes the sidebar by dragging the resize handle', async () => {
    const uiStore = useUiStore();
    uiStore.setSidebarWidth(150);
    const wrapper = mountSidebar();

    await wrapper.find('.sidebar-resize').trigger('mousedown', { clientX: 100 });
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 130 }));
    window.dispatchEvent(new MouseEvent('mouseup'));

    expect(uiStore.sidebarWidth).toBe(180);
  });
});
