import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
  }),
}));

describe('main.ts bootstrap', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    document.body.innerHTML = '<div id="app"></div>';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('mounts the app into #app', async () => {
    await import('@/main');

    expect(document.querySelector('.app')).not.toBeNull();
    expect(document.querySelector('.titlebar')).not.toBeNull();
    expect(document.querySelector('.toolbar')).not.toBeNull();
  });

  it('defaults to the Italian locale when none is stored', async () => {
    await import('@/main');

    expect(document.body.textContent).toContain('Nessun documento aperto');
  });

  it('uses the locale saved in localStorage', async () => {
    localStorage.setItem('doclatch:locale', 'en');

    await import('@/main');

    expect(document.body.textContent).toContain('No document open');
  });
});
