import { describe, it, expect, beforeEach } from 'vitest';
import { nextTick } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useRecentStore } from '@/stores/recent';

describe('useRecentStore', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('starts empty when there is nothing in storage', () => {
    const store = useRecentStore();

    expect(store.files).toEqual([]);
  });

  it('restores persisted files from storage', () => {
    localStorage.setItem('doclatch:recent-files', JSON.stringify(['/a.pdf', '/b.pdf']));
    const store = useRecentStore();

    expect(store.files).toEqual(['/a.pdf', '/b.pdf']);
  });

  it('falls back to an empty list when storage contains malformed JSON', () => {
    localStorage.setItem('doclatch:recent-files', '{not valid json');
    const store = useRecentStore();

    expect(store.files).toEqual([]);
  });

  it('adds a new path to the front of the list', () => {
    const store = useRecentStore();
    store.add('/a.pdf');
    store.add('/b.pdf');

    expect(store.files).toEqual(['/b.pdf', '/a.pdf']);
  });

  it('moves an already-present path back to the front instead of duplicating it', () => {
    const store = useRecentStore();
    store.add('/a.pdf');
    store.add('/b.pdf');
    store.add('/a.pdf');

    expect(store.files).toEqual(['/a.pdf', '/b.pdf']);
  });

  it('caps the list at 10 entries', () => {
    const store = useRecentStore();
    for (let i = 0; i < 12; i++)
      store.add(`/file-${i}.pdf`);

    expect(store.files).toHaveLength(10);
    expect(store.files[0]).toBe('/file-11.pdf');
  });

  it('extracts the file name from paths with either separator', () => {
    const store = useRecentStore();
    store.add('C:\\docs\\windows.pdf');
    store.add('/home/docs/unix.pdf');

    expect(store.entries.map((e) => e.name)).toEqual(['unix.pdf', 'windows.pdf']);
  });

  it('removes a specific path', () => {
    const store = useRecentStore();
    store.add('/a.pdf');
    store.add('/b.pdf');
    store.remove('/a.pdf');

    expect(store.files).toEqual(['/b.pdf']);
  });

  it('clears the whole list', () => {
    const store = useRecentStore();
    store.add('/a.pdf');
    store.add('/b.pdf');
    store.clear();

    expect(store.files).toEqual([]);
  });

  it('persists changes to storage', async () => {
    const store = useRecentStore();
    store.add('/a.pdf');

    await nextTick();

    expect(JSON.parse(localStorage.getItem('doclatch:recent-files') ?? '[]')).toEqual(['/a.pdf']);
  });
});
