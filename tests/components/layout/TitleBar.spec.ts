import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestI18n } from '../../helpers/testPlugins';
import TitleBar from '@/components/layout/TitleBar.vue';

const minimize = vi.fn();
const toggleMaximize = vi.fn();
const close = vi.fn();

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({ minimize, toggleMaximize, close }),
}));

function mountTitleBar() {
  return mount(TitleBar, {
    global: { plugins: [createTestI18n()] },
  });
}

describe('TitleBar', () => {
  beforeEach(() => {
    minimize.mockReset();
    toggleMaximize.mockReset();
    close.mockReset();
  });

  it('renders the app name', () => {
    const wrapper = mountTitleBar();

    expect(wrapper.find('.titlebar_logo-text').text()).toBe('PDFReader');
  });

  it('renders the three window controls with translated labels', () => {
    const wrapper = mountTitleBar();
    const buttons = wrapper.findAll('.titlebar_btn');

    expect(buttons).toHaveLength(3);
    expect(buttons[0].attributes('aria-label')).toBe('Riduci a icona');
    expect(buttons[1].attributes('aria-label')).toBe('Ripristina/Massimizza');
    expect(buttons[2].attributes('aria-label')).toBe('Chiudi');
  });

  it('minimizes the window when the first control is clicked', async () => {
    const wrapper = mountTitleBar();

    await wrapper.findAll('.titlebar_btn')[0].trigger('click');

    expect(minimize).toHaveBeenCalledTimes(1);
  });

  it('toggles maximize when the second control is clicked', async () => {
    const wrapper = mountTitleBar();

    await wrapper.findAll('.titlebar_btn')[1].trigger('click');

    expect(toggleMaximize).toHaveBeenCalledTimes(1);
  });

  it('closes the window when the third control is clicked', async () => {
    const wrapper = mountTitleBar();

    await wrapper.findAll('.titlebar_btn')[2].trigger('click');

    expect(close).toHaveBeenCalledTimes(1);
  });
});
