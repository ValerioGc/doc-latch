import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/document';
import { createTestI18n } from '../../helpers/testPlugins';
import AddPasswordDialog from '@/components/dialogs/AddPasswordDialog.vue';
import type { PdfError } from '@/types/pdf';

const addPassword = vi.fn();
const saveDialog = vi.fn();

vi.mock('@/composables/usePdf', () => ({
  usePdf: () => ({ addPassword }),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: (...args: unknown[]) => saveDialog(...args),
}));

function mountDialog() {
  return mount(AddPasswordDialog, {
    global: { plugins: [createTestI18n()] },
  });
}

describe('AddPasswordDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    addPassword.mockReset();
    saveDialog.mockReset();
  });

  it('disables the confirm button until a password is entered', async () => {
    const wrapper = mountDialog();

    expect(wrapper.find('.btn_primary').attributes('disabled')).toBeDefined();

    await wrapper.find('.add_password_input').setValue('new-secret');

    expect(wrapper.find('.btn_primary').attributes('disabled')).toBeUndefined();
  });

  it('does nothing when the save dialog is cancelled', async () => {
    saveDialog.mockResolvedValue(null);
    const wrapper = mountDialog();

    await wrapper.find('.add_password_input').setValue('new-secret');
    await wrapper.find('.btn_primary').trigger('click');
    await flushPromises();

    expect(addPassword).not.toHaveBeenCalled();
    expect(wrapper.find('.add_password_msg').exists()).toBe(false);
  });

  it('suggests a file name based on the open document', async () => {
    const docStore = useDocumentStore();
    docStore.setLoading('/test/contract.pdf');
    saveDialog.mockResolvedValue(null);
    const wrapper = mountDialog();

    await wrapper.find('.add_password_input').setValue('new-secret');
    await wrapper.find('.btn_primary').trigger('click');
    await flushPromises();

    expect(saveDialog).toHaveBeenCalledWith(
      expect.objectContaining({ defaultPath: 'contract (protetto).pdf' }),
    );
  });

  it('shows a success message after adding the password', async () => {
    saveDialog.mockResolvedValue('/test/out.pdf');
    addPassword.mockResolvedValue(null);
    const wrapper = mountDialog();

    await wrapper.find('.add_password_input').setValue('new-secret');
    await wrapper.find('.btn_primary').trigger('click');
    await flushPromises();

    expect(addPassword).toHaveBeenCalledWith('new-secret', '/test/out.pdf');
    expect(wrapper.find('.add_password_msg--error').exists()).toBe(false);
    expect(wrapper.find('.add_password_msg').exists()).toBe(true);
  });

  it('shows an error message when adding the password fails', async () => {
    saveDialog.mockResolvedValue('/test/out.pdf');
    const err: PdfError = { kind: 'AlreadyEncrypted', message: 'già protetto' };
    addPassword.mockResolvedValue(err);
    const wrapper = mountDialog();

    await wrapper.find('.add_password_input').setValue('new-secret');
    await wrapper.find('.btn_primary').trigger('click');
    await flushPromises();

    expect(wrapper.find('.add_password_msg--error').exists()).toBe(true);
  });

  it('emits close when the cancel button is clicked', async () => {
    const wrapper = mountDialog();

    await wrapper.find('.btn_ghost').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('emits close from the done state close button', async () => {
    saveDialog.mockResolvedValue('/test/out.pdf');
    addPassword.mockResolvedValue(null);
    const wrapper = mountDialog();

    await wrapper.find('.add_password_input').setValue('new-secret');
    await wrapper.find('.btn_primary').trigger('click');
    await flushPromises();

    await wrapper.find('.btn_primary').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
