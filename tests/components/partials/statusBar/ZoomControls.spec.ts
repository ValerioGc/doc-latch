import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/document';
import { createTestI18n } from '../../../helpers/testPlugins';
import ZoomControls from '@/components/partials/statusBar/ZoomControls.vue';

function mountComponent() {
  return mount(ZoomControls, {
    global: { plugins: [createTestI18n()] },
  });
}

describe('ZoomControls', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    useDocumentStore().setLoading('/test/doc.pdf');
  });

  it('decreases the zoom when the zoom-out button is clicked', async () => {
    const docStore = useDocumentStore();
    docStore.setZoom(100);
    const wrapper = mountComponent();

    await wrapper.findAll('.zoom_btn')[0].trigger('click');

    expect(docStore.zoom).toBe(90);
  });

  it('increases the zoom when the zoom-in button is clicked', async () => {
    const docStore = useDocumentStore();
    docStore.setZoom(100);
    const wrapper = mountComponent();

    await wrapper.findAll('.zoom_btn')[1].trigger('click');

    expect(docStore.zoom).toBe(110);
  });

  it('resets the zoom to 100 when the reset button is clicked', async () => {
    const docStore = useDocumentStore();
    docStore.setZoom(200);
    const wrapper = mountComponent();

    await wrapper.findAll('.zoom_btn')[2].trigger('click');

    expect(docStore.zoom).toBe(100);
  });

  it('disables the reset button once zoom is already 100', () => {
    const docStore = useDocumentStore();
    docStore.setZoom(100);
    const wrapper = mountComponent();

    expect(wrapper.findAll('.zoom_btn')[2].attributes('disabled')).toBeDefined();
  });

  it('shows only the preset zoom options when the current zoom is a preset', () => {
    const docStore = useDocumentStore();
    docStore.setZoom(150);
    const wrapper = mountComponent();

    const options = wrapper.findAll('option').map((o) => o.text());
    expect(options).toEqual(['50%', '75%', '100%', '125%', '150%', '200%', '300%', '400%']);
  });

  it('injects the current zoom into the option list when it is not a preset', () => {
    const docStore = useDocumentStore();
    docStore.setZoom(110);
    const wrapper = mountComponent();

    const options = wrapper.findAll('option').map((o) => o.text());
    expect(options).toContain('110%');
    expect(options.indexOf('100%')).toBeLessThan(options.indexOf('110%'));
    expect(options.indexOf('110%')).toBeLessThan(options.indexOf('125%'));
  });

  it('changes the zoom when a new option is selected', async () => {
    const docStore = useDocumentStore();
    docStore.setZoom(100);
    const wrapper = mountComponent();

    await wrapper.find('.zoom_select').setValue('200');

    expect(docStore.zoom).toBe(200);
  });
});
