import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../helpers/testPlugins';
import InfoDialog from '@/components/dialogs/InfoDialog.vue';

const open = vi.fn();

vi.mock('@tauri-apps/plugin-shell', () => ({ open: (url: string) => open(url) }));

function mountDialog() {
  return mount(InfoDialog, {
    global: { plugins: [createTestI18n()] },
  });
}

describe('InfoDialog', () => {
  beforeEach(() => {
    open.mockReset();
  });

  it('renders the app title and description', () => {
    const wrapper = mountDialog();

    expect(wrapper.find('.dialog_title').text()).toBe('DocLatch');
    expect(wrapper.find('.dialog_desc').text()).toContain('Tauri 2');
  });

  it('emits close when the close button is clicked', async () => {
    const wrapper = mountDialog();

    await wrapper.find('.btn_ghost').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('opens the GitHub url when the GitHub button is clicked', async () => {
    const wrapper = mountDialog();

    await wrapper.find('.btn_primary').trigger('click');

    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith(import.meta.env.VITE_GITHUB_URL);
  });
});
