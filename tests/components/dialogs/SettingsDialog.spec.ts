import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { createTestI18n } from '../../helpers/testPlugins';
import SettingsDialog from '@/components/dialogs/SettingsDialog.vue';

function mountDialog() {
  return mount(SettingsDialog, {
    global: {
      plugins: [createTestI18n()],
      stubs: { AppearanceSettings: true, SidebarSettings: true, LanguageSettings: true },
    },
  });
}

describe('SettingsDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the settings title', () => {
    const wrapper = mountDialog();

    expect(wrapper.find('.dialog_title').text()).toBe('Impostazioni');
  });

  it('renders the appearance, sidebar and language sections', () => {
    const wrapper = mountDialog();

    expect(wrapper.findComponent({ name: 'AppearanceSettings' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'SidebarSettings' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'LanguageSettings' }).exists()).toBe(true);
  });

  it('emits close when the close button is clicked', async () => {
    const wrapper = mountDialog();

    await wrapper.find('.btn_primary').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
