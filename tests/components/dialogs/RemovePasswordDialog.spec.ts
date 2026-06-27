import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/document';
import { createTestI18n } from '../../helpers/testPlugins';
import RemovePasswordDialog from '@/components/dialogs/RemovePasswordDialog.vue';
import type { PdfError } from '@/types/pdf';

const removePassword = vi.fn();
const saveDialog = vi.fn();

vi.mock('@/composables/usePdf', () => ({
  usePdf: () => ({ removePassword }),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: (...args: unknown[]) => saveDialog(...args),
}));

function mountDialog() {
  return mount(RemovePasswordDialog, {
    global: { plugins: [createTestI18n()] },
  });
}

describe('RemovePasswordDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    removePassword.mockReset();
    saveDialog.mockReset();
  });

  it('does nothing when the save dialog is cancelled', async () => {
    saveDialog.mockResolvedValue(null);
    const wrapper = mountDialog();

    await wrapper.find('.btn_primary').trigger('click');
    await flushPromises();

    expect(removePassword).not.toHaveBeenCalled();
    expect(wrapper.find('.remove_password_msg').exists()).toBe(false);
  });

  it('suggests a file name based on the open document', async () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/test/contract.pdf');
    saveDialog.mockResolvedValue(null);
    const wrapper = mountDialog();

    await wrapper.find('.btn_primary').trigger('click');
    await flushPromises();

    expect(saveDialog).toHaveBeenCalledWith(
      expect.objectContaining({ defaultPath: 'contract (senza password).pdf' }),
    );
  });

  it('shows a success message after removing the password', async () => {
    saveDialog.mockResolvedValue('/test/out.pdf');
    removePassword.mockResolvedValue(null);
    const wrapper = mountDialog();

    await wrapper.find('.btn_primary').trigger('click');
    await flushPromises();

    expect(removePassword).toHaveBeenCalledWith('/test/out.pdf');
    expect(wrapper.find('.remove_password_msg--error').exists()).toBe(false);
    expect(wrapper.find('.remove_password_msg').exists()).toBe(true);
  });

  it('shows an error message when removing the password fails', async () => {
    saveDialog.mockResolvedValue('/test/out.pdf');
    const err: PdfError = { kind: 'WrongPassword', message: 'nope' };
    removePassword.mockResolvedValue(err);
    const wrapper = mountDialog();

    await wrapper.find('.btn_primary').trigger('click');
    await flushPromises();

    expect(wrapper.find('.remove_password_msg--error').exists()).toBe(true);
  });

  it('emits close when the cancel button is clicked', async () => {
    const wrapper = mountDialog();

    await wrapper.find('.btn_ghost').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('emits close from the done state close button', async () => {
    saveDialog.mockResolvedValue('/test/out.pdf');
    removePassword.mockResolvedValue(null);
    const wrapper = mountDialog();

    await wrapper.find('.btn_primary').trigger('click');
    await flushPromises();

    await wrapper.find('.btn_primary').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
