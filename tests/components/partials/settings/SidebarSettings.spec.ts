import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useUiStore } from '@/stores/ui';
import { createTestI18n } from '../../../helpers/testPlugins';
import SidebarSettings from '@/components/partials/settings/SidebarSettings.vue';

function mountComponent() {
  return mount(SidebarSettings, {
    global: { plugins: [createTestI18n()] },
  });
}

describe('SidebarSettings', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('is unchecked when the sidebar is visible', () => {
    const wrapper = mountComponent();

    expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(false);
  });

  it('is checked when the sidebar is hidden', () => {
    const uiStore = useUiStore();
    uiStore.setSidebarHidden(true);
    const wrapper = mountComponent();

    expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(true);
  });

  it('hides the sidebar on toggle', async () => {
    const uiStore = useUiStore();
    const wrapper = mountComponent();

    await wrapper.find('input').setValue(true);

    expect(uiStore.sidebarHidden).toBe(true);
  });

  it('shows the sidebar again on toggle', async () => {
    const uiStore = useUiStore();
    uiStore.setSidebarHidden(true);
    const wrapper = mountComponent();

    await wrapper.find('input').setValue(false);

    expect(uiStore.sidebarHidden).toBe(false);
  });
});
