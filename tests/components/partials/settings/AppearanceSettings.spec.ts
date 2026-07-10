import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useUiStore } from '@/stores/ui';
import { createTestI18n } from '../../../helpers/testPlugins';
import AppearanceSettings from '@/components/partials/settings/AppearanceSettings.vue';

function mountComponent() {
  return mount(AppearanceSettings, {
    global: { plugins: [createTestI18n()] },
  });
}

describe('AppearanceSettings', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('is unchecked when the theme is light', () => {
    const wrapper = mountComponent();

    expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(false);
  });

  it('is checked when the theme is dark', () => {
    const uiStore = useUiStore();
    uiStore.setTheme('dark');
    const wrapper = mountComponent();

    expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(true);
  });

  it('switches from light to dark on toggle', async () => {
    const uiStore = useUiStore();
    const wrapper = mountComponent();

    await wrapper.find('input').setValue(true);

    expect(uiStore.theme).toBe('dark');
  });

  it('switches from dark to light on toggle', async () => {
    const uiStore = useUiStore();
    uiStore.setTheme('dark');
    const wrapper = mountComponent();

    await wrapper.find('input').setValue(false);

    expect(uiStore.theme).toBe('light');
  });

  describe('text size selector', () => {
    it('renders three size buttons', () => {
      const wrapper = mountComponent();
      expect(wrapper.findAll('.size_btn')).toHaveLength(3);
    });

    it('marks the medium button as active by default', () => {
      const wrapper = mountComponent();
      const buttons = wrapper.findAll('.size_btn');
      expect(buttons[1].classes()).toContain('active');
    });

    it('sets textSize to small when the first button is clicked', async () => {
      const uiStore = useUiStore();
      const wrapper = mountComponent();

      await wrapper.findAll('.size_btn')[0].trigger('click');

      expect(uiStore.textSize).toBe('small');
    });

    it('sets textSize to large when the third button is clicked', async () => {
      const uiStore = useUiStore();
      const wrapper = mountComponent();

      await wrapper.findAll('.size_btn')[2].trigger('click');

      expect(uiStore.textSize).toBe('large');
    });

    it('marks the active size button with the active class', async () => {
      const uiStore = useUiStore();
      const wrapper = mountComponent();

      await wrapper.findAll('.size_btn')[2].trigger('click');

      const buttons = wrapper.findAll('.size_btn');
      expect(buttons[2].classes()).toContain('active');
      expect(buttons[0].classes()).not.toContain('active');
      expect(buttons[1].classes()).not.toContain('active');
    });
  });
});
