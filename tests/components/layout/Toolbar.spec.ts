import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/document';
import { useRecentStore } from '@/stores/recent';
import { createTestI18n } from '../../helpers/testPlugins';
import Toolbar from '@/components/layout/Toolbar.vue';

const openFile = vi.fn();
const openRecentFile = vi.fn();
const getSecurityInfo = vi.fn();
const removePassword = vi.fn();
const addPassword = vi.fn();

vi.mock('@/composables/usePdf', () => ({
  usePdf: () => ({
    openFile,
    openRecentFile,
    openWithPassword: vi.fn(),
    getSecurityInfo,
    removePassword,
    addPassword,
  }),
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
    getSecurityInfo.mockReset();
    getSecurityInfo.mockResolvedValue(null);
    removePassword.mockReset();
    addPassword.mockReset();
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

  it('disables the protection menu when no document is open and enables it once open', async () => {
    const docStore = useDocumentStore();
    const wrapper = mountToolbar();

    const protectionMenuBtn = wrapper.findAll('.menu-btn')[1];
    expect(protectionMenuBtn.attributes('disabled')).toBeDefined();

    await protectionMenuBtn.trigger('click');
    expect(wrapper.find('.dropdown').exists()).toBe(false);

    await wrapper.findAll('.menu-item')[1].trigger('mouseenter');
    expect(wrapper.find('.dropdown').exists()).toBe(false);

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

    expect(protectionMenuBtn.attributes('disabled')).toBeUndefined();

    await protectionMenuBtn.trigger('click');
    const securityInfoBtn = wrapper.find('.dropdown .drop-item');
    expect(securityInfoBtn.exists()).toBe(true);

    await securityInfoBtn.trigger('click');
    expect(wrapper.findComponent({ name: 'SecurityInfoDialog' }).exists()).toBe(true);
  });

  it('closes the security info dialog when it emits close', async () => {
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
    await wrapper.findAll('.menu-btn')[1].trigger('click');
    await wrapper.find('.dropdown .drop-item').trigger('click');

    await wrapper.findComponent({ name: 'SecurityInfoDialog' }).vm.$emit('close');

    expect(wrapper.findComponent({ name: 'SecurityInfoDialog' }).exists()).toBe(false);
  });

  it('disables add password when no document is open and enables it for an unencrypted document', async () => {
    const docStore = useDocumentStore();
    const wrapper = mountToolbar();

    const protectionMenuBtn = wrapper.findAll('.menu-btn')[1];
    await protectionMenuBtn.trigger('click');
    let addPasswordBtn = wrapper.findAll('.dropdown .drop-item')[1];
    expect(addPasswordBtn.attributes('disabled')).toBeDefined();

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

    addPasswordBtn = wrapper.findAll('.dropdown .drop-item')[1];
    expect(addPasswordBtn.attributes('disabled')).toBeUndefined();

    await addPasswordBtn.trigger('click');
    expect(wrapper.findComponent({ name: 'AddPasswordDialog' }).exists()).toBe(true);
    expect(wrapper.find('.dropdown').exists()).toBe(false);
  });

  it('disables add password for an already encrypted document', async () => {
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
      isEncrypted: true,
    });
    const wrapper = mountToolbar();

    await wrapper.findAll('.menu-btn')[1].trigger('click');
    const addPasswordBtn = wrapper.findAll('.dropdown .drop-item')[1];

    expect(addPasswordBtn.attributes('disabled')).toBeDefined();
  });

  it('closes the add password dialog when it emits close', async () => {
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
    await wrapper.findAll('.menu-btn')[1].trigger('click');
    await wrapper.findAll('.dropdown .drop-item')[1].trigger('click');

    await wrapper.findComponent({ name: 'AddPasswordDialog' }).vm.$emit('close');

    expect(wrapper.findComponent({ name: 'AddPasswordDialog' }).exists()).toBe(false);
  });

  it('disables remove password when the document is not encrypted and enables it once encrypted', async () => {
    const docStore = useDocumentStore();
    const wrapper = mountToolbar();

    const protectionMenuBtn = wrapper.findAll('.menu-btn')[1];
    await protectionMenuBtn.trigger('click');
    let removePasswordBtn = wrapper.findAll('.dropdown .drop-item').at(-1);
    expect(removePasswordBtn?.attributes('disabled')).toBeDefined();

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
      isEncrypted: true,
    });
    await wrapper.vm.$nextTick();

    removePasswordBtn = wrapper.findAll('.dropdown .drop-item').at(-1);
    expect(removePasswordBtn?.attributes('disabled')).toBeUndefined();

    await removePasswordBtn?.trigger('click');
    expect(wrapper.findComponent({ name: 'RemovePasswordDialog' }).exists()).toBe(true);
    expect(wrapper.find('.dropdown').exists()).toBe(false);
  });

  it('closes the remove password dialog when it emits close', async () => {
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
      isEncrypted: true,
    });
    const wrapper = mountToolbar();
    await wrapper.findAll('.menu-btn')[1].trigger('click');
    await wrapper.findAll('.dropdown .drop-item').at(-1)?.trigger('click');

    await wrapper.findComponent({ name: 'RemovePasswordDialog' }).vm.$emit('close');

    expect(wrapper.findComponent({ name: 'RemovePasswordDialog' }).exists()).toBe(false);
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
