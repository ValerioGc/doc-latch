import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseDialog from '@/components/dialogs/BaseDialog.vue';

describe('BaseDialog', () => {
  it('renders the title prop', () => {
    const wrapper = mount(BaseDialog, {
      props: { title: 'Titolo prova' },
    });

    expect(wrapper.find('.dialog_title').text()).toBe('Titolo prova');
  });

  it('renders default slot content', () => {
    const wrapper = mount(BaseDialog, {
      slots: { default: '<p class="content">Contenuto</p>' },
    });

    expect(wrapper.find('.content').text()).toBe('Contenuto');
  });

  it('does not render the actions wrapper when no actions slot is provided', () => {
    const wrapper = mount(BaseDialog);

    expect(wrapper.find('.dialog_actions').exists()).toBe(false);
  });

  it('renders the actions slot when provided', () => {
    const wrapper = mount(BaseDialog, {
      slots: { actions: '<button class="ok">OK</button>' },
    });

    expect(wrapper.find('.dialog_actions .ok').exists()).toBe(true);
  });

  it('applies the centered class when the centered prop is true', () => {
    const wrapper = mount(BaseDialog, {
      props: { centered: true },
    });

    expect(wrapper.find('.dialog').classes()).toContain('dialog--centered');
  });

  it('applies the width prop as inline style', () => {
    const wrapper = mount(BaseDialog, {
      props: { width: '500px' },
    });

    expect(wrapper.find('.dialog').attributes('style')).toContain('width: 500px');
  });

  it('emits close when the backdrop is clicked and closeOnBackdrop is true', async () => {
    const wrapper = mount(BaseDialog);

    await wrapper.find('.dialog_host').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('does not emit close on backdrop click when closeOnBackdrop is false', async () => {
    const wrapper = mount(BaseDialog, {
      props: { closeOnBackdrop: false },
    });

    await wrapper.find('.dialog_host').trigger('click');

    expect(wrapper.emitted('close')).toBeUndefined();
  });

  it('emits close when the Escape key is pressed', async () => {
    const wrapper = mount(BaseDialog);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('removes the keydown listener on unmount', async () => {
    const wrapper = mount(BaseDialog);
    wrapper.unmount();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await Promise.resolve();

    expect(wrapper.emitted('close')).toBeUndefined();
  });
});
