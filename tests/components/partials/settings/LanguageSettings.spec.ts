import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useUiStore } from '@/stores/ui';
import { createTestI18n } from '../../../helpers/testPlugins';
import LanguageSettings from '@/components/partials/settings/LanguageSettings.vue';

function mountComponent() {
  return mount(LanguageSettings, {
    global: { plugins: [createTestI18n()] },
  });
}

describe('LanguageSettings', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('shows the current locale label in the trigger', () => {
    const wrapper = mountComponent();

    expect(wrapper.find('.lang_select_trigger').text()).toBe('Italiano');
  });

  it('does not show the menu until the trigger is clicked', () => {
    const wrapper = mountComponent();

    expect(wrapper.find('.lang_select_menu').exists()).toBe(false);
  });

  it('opens the menu with all locales when the trigger is clicked', async () => {
    const wrapper = mountComponent();

    await wrapper.find('.lang_select_trigger').trigger('click');

    expect(wrapper.findAll('.lang_select_option')).toHaveLength(4);
  });

  it('closes the menu when the overlay is clicked', async () => {
    const wrapper = mountComponent();

    await wrapper.find('.lang_select_trigger').trigger('click');
    await wrapper.find('.lang_select_overlay').trigger('click');

    expect(wrapper.find('.lang_select_menu').exists()).toBe(false);
  });

  it('changes the locale and closes the menu when an option is clicked', async () => {
    const uiStore = useUiStore();
    const wrapper = mountComponent();

    await wrapper.find('.lang_select_trigger').trigger('click');
    const frenchOption = wrapper.findAll('.lang_select_option')
      .find((el) => el.text().includes('Français'));
    await frenchOption?.trigger('click');

    expect(uiStore.locale).toBe('fr');
    expect(wrapper.find('.lang_select_menu').exists()).toBe(false);
  });

  it('marks the active locale with aria-current', async () => {
    const wrapper = mountComponent();

    await wrapper.find('.lang_select_trigger').trigger('click');
    const italianOption = wrapper.findAll('.lang_select_option')
      .find((el) => el.text().includes('Italiano'));

    expect(italianOption?.attributes('aria-current')).toBe('true');
  });
});
