import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/document';
import { useRecentStore } from '@/stores/recent';
import { createTestI18n } from '../../helpers/testPlugins';
import Toolbar from '@/components/layout/Toolbar.vue';

const openFile = vi.fn();
const openRecentFile = vi.fn();

vi.mock('@/composables/usePdf', () => ({
  usePdf: () => ({ openFile, openRecentFile, openWithPassword: vi.fn() }),
}));

function mountToolbar() {
  return mount(Toolbar, {
    global: {
      plugins: [createTestI18n()],
      stubs: { teleport: true },
    },
  });
}

describe('Toolbar', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    openFile.mockReset();
    openRecentFile.mockReset();
  });

  it('toggles the file dropdown when the File button is clicked', async () => {
    const wrapper = mountToolbar();

    expect(wrapper.find('.dropdown').exists()).toBe(false);

    await wrapper.find('.menu-btn').trigger('click');
    expect(wrapper.find('.dropdown').exists()).toBe(true);

    await wrapper.find('.menu-btn').trigger('click');
    expect(wrapper.find('.dropdown').exists()).toBe(false);
  });

  it('closes the dropdown when the overlay is clicked', async () => {
    const wrapper = mountToolbar();

    await wrapper.find('.menu-btn').trigger('click');
    expect(wrapper.find('.dropdown').exists()).toBe(true);

    await wrapper.find('.menu-overlay').trigger('click');
    expect(wrapper.find('.dropdown').exists()).toBe(false);
  });

  it('calls openFile and closes the menu when "Apri file" is clicked', async () => {
    const wrapper = mountToolbar();

    await wrapper.find('.menu-btn').trigger('click');
    await wrapper.find('.drop-item').trigger('click');

    expect(openFile).toHaveBeenCalledTimes(1);
    expect(wrapper.find('.dropdown').exists()).toBe(false);
  });

  it('disables the recent-files entry when there are no recent files', async () => {
    const wrapper = mountToolbar();

    await wrapper.find('.menu-btn').trigger('click');
    const recentBtn = wrapper.findAll('.drop-item')[1];

    expect(recentBtn.attributes('disabled')).toBeDefined();
  });

  it('does not open the recent-files submenu when there are no recent files', async () => {
    const wrapper = mountToolbar();

    await wrapper.find('.menu-btn').trigger('click');
    const recentBtn = wrapper.findAll('.drop-item')[1];
    await recentBtn.trigger('click');

    expect(wrapper.find('.submenu').exists()).toBe(false);
  });

  it('opens the file menu on hover and closes it on mouse leave', async () => {
    const wrapper = mountToolbar();

    await wrapper.find('.menu-item').trigger('mouseenter');
    expect(wrapper.find('.dropdown').exists()).toBe(true);

    await wrapper.find('.menu-item').trigger('mouseleave');
    expect(wrapper.find('.dropdown').exists()).toBe(false);
  });

  it('opens the recent-files submenu on hover and closes it on mouse leave', async () => {
    const recentStore = useRecentStore();
    recentStore.add('/path/to/file.pdf');
    const wrapper = mountToolbar();
    await wrapper.find('.menu-btn').trigger('click');

    await wrapper.find('.drop-item-wrap').trigger('mouseenter');
    expect(wrapper.find('.submenu').exists()).toBe(true);

    await wrapper.find('.drop-item-wrap').trigger('mouseleave');
    expect(wrapper.find('.submenu').exists()).toBe(false);
  });

  it('does not open the recent-files submenu on hover when there are no recent files', async () => {
    const wrapper = mountToolbar();
    await wrapper.find('.menu-btn').trigger('click');

    await wrapper.find('.drop-item-wrap').trigger('mouseenter');

    expect(wrapper.find('.submenu').exists()).toBe(false);
  });

  it('shows recent files and opens one on click', async () => {
    const recentStore = useRecentStore();
    recentStore.add('/path/to/file.pdf');
    const wrapper = mountToolbar();

    await wrapper.find('.menu-btn').trigger('click');
    const recentBtn = wrapper.findAll('.drop-item')[1];
    await recentBtn.trigger('click');

    const submenuItem = wrapper.find('.submenu .drop-item');
    expect(submenuItem.exists()).toBe(true);
    expect(submenuItem.text()).toContain('file.pdf');

    await submenuItem.trigger('click');
    expect(openRecentFile).toHaveBeenCalledWith('/path/to/file.pdf');
  });

  it('disables doc info when no document is open and enables it once open', async () => {
    const docStore = useDocumentStore();
    const wrapper = mountToolbar();

    await wrapper.find('.menu-btn').trigger('click');
    let docInfoBtn = wrapper.findAll('.drop-item').at(-1);
    expect(docInfoBtn?.attributes('disabled')).toBeDefined();

    docStore.setReady({
      path: '/test/doc.pdf',
      pageCount: 1,
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
    });
    await wrapper.vm.$nextTick();

    docInfoBtn = wrapper.findAll('.drop-item').at(-1);
    expect(docInfoBtn?.attributes('disabled')).toBeUndefined();

    await docInfoBtn?.trigger('click');
    expect(wrapper.findComponent({ name: 'DocInfoDialog' }).exists()).toBe(true);
  });

  it('opens the settings dialog when the settings icon is clicked', async () => {
    const wrapper = mountToolbar();
    const settingsBtn = wrapper.findAll('.icon-btn')[0];

    await settingsBtn.trigger('click');

    expect(wrapper.findComponent({ name: 'SettingsDialog' }).exists()).toBe(true);
  });

  it('opens the info dialog when the info icon is clicked', async () => {
    const wrapper = mountToolbar();
    const infoBtn = wrapper.findAll('.icon-btn')[1];

    await infoBtn.trigger('click');

    expect(wrapper.findComponent({ name: 'InfoDialog' }).exists()).toBe(true);
  });

  it('closes the settings dialog when it emits close', async () => {
    const wrapper = mountToolbar();
    await wrapper.findAll('.icon-btn')[0].trigger('click');

    await wrapper.findComponent({ name: 'SettingsDialog' }).vm.$emit('close');

    expect(wrapper.findComponent({ name: 'SettingsDialog' }).exists()).toBe(false);
  });

  it('closes the info dialog when it emits close', async () => {
    const wrapper = mountToolbar();
    await wrapper.findAll('.icon-btn')[1].trigger('click');

    await wrapper.findComponent({ name: 'InfoDialog' }).vm.$emit('close');

    expect(wrapper.findComponent({ name: 'InfoDialog' }).exists()).toBe(false);
  });

  it('closes the doc info dialog when it emits close', async () => {
    const docStore = useDocumentStore();
    docStore.setReady({
      path: '/test/doc.pdf',
      pageCount: 1,
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
    });
    const wrapper = mountToolbar();
    await wrapper.find('.menu-btn').trigger('click');
    await wrapper.findAll('.drop-item').at(-1)?.trigger('click');

    await wrapper.findComponent({ name: 'DocInfoDialog' }).vm.$emit('close');

    expect(wrapper.findComponent({ name: 'DocInfoDialog' }).exists()).toBe(false);
  });
});
