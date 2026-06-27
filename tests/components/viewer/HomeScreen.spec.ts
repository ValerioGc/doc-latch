import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useRecentStore } from '@/stores/recent';
import { createTestI18n } from '../../helpers/testPlugins';
import HomeScreen from '@/components/viewer/HomeScreen.vue';

const openFile = vi.fn();
const openRecentFile = vi.fn();

vi.mock('@/composables/usePdf', () => ({
  usePdf: () => ({ openFile, openRecentFile }),
}));

function mountHome() {
  return mount(HomeScreen, {
    global: { plugins: [createTestI18n()] },
  });
}

describe('HomeScreen', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    openFile.mockReset();
    openRecentFile.mockReset();
  });

  it('shows the empty state when there are no recent files', () => {
    const wrapper = mountHome();

    expect(wrapper.find('.recent_empty').exists()).toBe(true);
    expect(wrapper.find('.recent_list').exists()).toBe(false);
  });

  it('calls openFile when the main open button is clicked', async () => {
    const wrapper = mountHome();

    await wrapper.find('.home_open-btn').trigger('click');

    expect(openFile).toHaveBeenCalledTimes(1);
  });

  it('lists recent files and opens one on click', async () => {
    const recentStore = useRecentStore();
    recentStore.add('/path/to/file.pdf');
    const wrapper = mountHome();

    const item = wrapper.find('.recent_item');
    expect(item.text()).toContain('file.pdf');

    await item.trigger('click');
    expect(openRecentFile).toHaveBeenCalledWith('/path/to/file.pdf');
  });

  it('removes a file from the list without opening it', async () => {
    const recentStore = useRecentStore();
    recentStore.add('/path/to/file.pdf');
    const wrapper = mountHome();

    await wrapper.find('.recent_remove').trigger('click');

    expect(openRecentFile).not.toHaveBeenCalled();
    expect(recentStore.entries).toHaveLength(0);
    expect(wrapper.find('.recent_empty').exists()).toBe(true);
  });

  it('only removes the targeted entry when multiple recent files are listed', async () => {
    const recentStore = useRecentStore();
    recentStore.add('/path/to/first.pdf');
    recentStore.add('/path/to/second.pdf');
    const wrapper = mountHome();

    await wrapper.findAll('.recent_remove')[0].trigger('click');

    expect(recentStore.entries.map((e) => e.path)).toEqual(['/path/to/first.pdf']);
  });
});
