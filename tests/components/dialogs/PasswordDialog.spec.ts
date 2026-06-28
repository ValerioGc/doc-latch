import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/document';
import { createTestI18n } from '../../helpers/testPlugins';
import PasswordDialog from '@/components/dialogs/password/PasswordDialog.vue';

const openWithPassword = vi.fn();

vi.mock('@/composables/usePdf', () => ({
  usePdf: () => ({ openWithPassword }),
}));

function mountDialog() {
  return mount(PasswordDialog, {
    global: { plugins: [createTestI18n()] },
  });
}

describe('PasswordDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    openWithPassword.mockReset();
  });

  it('disables the confirm button when the password field is empty', () => {
    const wrapper = mountDialog();

    expect(wrapper.find('.btn_primary').attributes('disabled')).toBeDefined();
  });

  it('enables the confirm button once a password is typed', async () => {
    const wrapper = mountDialog();

    await wrapper.find('.password_input').setValue('secret');

    expect(wrapper.find('.btn_primary').attributes('disabled')).toBeUndefined();
  });

  it('calls openWithPassword with the typed value on confirm', async () => {
    openWithPassword.mockResolvedValue(true);
    const wrapper = mountDialog();

    await wrapper.find('.password_input').setValue('secret');
    await wrapper.find('.btn_primary').trigger('click');

    expect(openWithPassword).toHaveBeenCalledWith('secret');
  });

  it('shows the wrong-password error and clears the field on failure', async () => {
    openWithPassword.mockResolvedValue(false);
    const wrapper = mountDialog();

    await wrapper.find('.password_input').setValue('wrong');
    await wrapper.find('.btn_primary').trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.error_msg').exists()).toBe(true);
    expect((wrapper.find('.password_input').element as HTMLInputElement).value).toBe('');
  });

  it('closes the document after the maximum number of wrong attempts', async () => {
    openWithPassword.mockResolvedValue(false);
    const wrapper = mountDialog();
    const docStore = useDocumentStore();
    docStore.setLoading('/test/doc.pdf');

    for (let i = 0; i < 3; i++) {
      await wrapper.find('.password_input').setValue('wrong');
      await wrapper.find('.btn_primary').trigger('click');
    }

    expect(docStore.state).toBe('idle');
  });

  it('submits when Enter is pressed in the password field', async () => {
    openWithPassword.mockResolvedValue(true);
    const wrapper = mountDialog();

    await wrapper.find('.password_input').setValue('secret');
    await wrapper.find('.password_input').trigger('keydown.enter');

    expect(openWithPassword).toHaveBeenCalledWith('secret');
  });

  it('calls docStore.close when cancel is clicked', async () => {
    const wrapper = mountDialog();
    const docStore = useDocumentStore();
    docStore.setLoading('/test/doc.pdf');

    await wrapper.find('.btn_ghost').trigger('click');

    expect(docStore.state).toBe('idle');
  });
});
