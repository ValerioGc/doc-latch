import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/document';
import { createTestI18n } from '../../helpers/testPlugins';
import SecurityInfoDialog from '@/components/dialogs/SecurityInfoDialog.vue';
import type { SecurityInfo } from '@/types/pdf';

const getSecurityInfo = vi.fn();

vi.mock('@/composables/usePdf', () => ({
  usePdf: () => ({ getSecurityInfo }),
}));

const unencryptedInfo: SecurityInfo = {
  isEncrypted: false,
  encryptionMethod: null,
  keyLengthBits: null,
  canPrint: true,
  canPrintHighRes: true,
  canModify: true,
  canCopy: true,
  canAnnotate: true,
  canFillForms: true,
  canExtractForAccessibility: true,
  canAssemble: true,
};

const encryptedInfo: SecurityInfo = {
  isEncrypted: true,
  encryptionMethod: 'AES',
  keyLengthBits: 256,
  canPrint: true,
  canPrintHighRes: false,
  canModify: false,
  canCopy: true,
  canAnnotate: false,
  canFillForms: true,
  canExtractForAccessibility: false,
  canAssemble: true,
};

function mountDialog() {
  return mount(SecurityInfoDialog, {
    global: { plugins: [createTestI18n()] },
  });
}

describe('SecurityInfoDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getSecurityInfo.mockReset();
  });

  it('does not call the backend when no document is open', async () => {
    getSecurityInfo.mockResolvedValue(null);
    mountDialog();
    await flushPromises();

    expect(getSecurityInfo).not.toHaveBeenCalled();
  });

  it('shows the loading state before the backend responds', () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/test/doc.pdf');
    getSecurityInfo.mockReturnValue(new Promise(() => {}));

    const wrapper = mountDialog();

    expect(wrapper.find('.security_status').text()).toBe('Caricamento…');
  });

  it('shows an error message when the backend call fails', async () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/test/doc.pdf');
    getSecurityInfo.mockResolvedValue(null);

    const wrapper = mountDialog();
    await flushPromises();

    expect(wrapper.find('.security_status--error').exists()).toBe(true);
  });

  it('shows the unencrypted hint and full permissions for a non-encrypted document', async () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/test/doc.pdf');
    getSecurityInfo.mockResolvedValue(unencryptedInfo);

    const wrapper = mountDialog();
    await flushPromises();

    expect(wrapper.find('.security_hint').exists()).toBe(true);
    expect(wrapper.findAll('.security_value--denied')).toHaveLength(0);
  });

  it('shows encryption details and denied permissions for an encrypted document', async () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/test/doc.pdf');
    getSecurityInfo.mockResolvedValue(encryptedInfo);

    const wrapper = mountDialog();
    await flushPromises();

    expect(wrapper.find('.security_list').text()).toContain('AES');
    expect(wrapper.find('.security_list').text()).toContain('256 bit');
    expect(wrapper.findAll('.security_value--denied')).toHaveLength(4);
  });

  it('emits close when the close button is clicked', async () => {
    getSecurityInfo.mockResolvedValue(null);
    const wrapper = mountDialog();
    await flushPromises();

    await wrapper.find('.btn_primary').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
