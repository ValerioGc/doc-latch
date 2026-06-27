import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUiStore } from '@/stores/ui'

describe('useUiStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('defaults to light theme', () => {
    const store = useUiStore()
    expect(store.theme).toBe('light')
  })

  it('setTheme changes the theme', () => {
    const store = useUiStore()
    store.setTheme('dark')
    expect(store.theme).toBe('dark')
  })

  it('setTheme to system follows the OS preference', () => {
    const store = useUiStore()
    store.setTheme('system')
    expect(store.theme).toBe('system')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggleSidebar collapses and expands', () => {
    const store = useUiStore()
    expect(store.sidebarCollapsed).toBe(false)
    store.toggleSidebar()
    expect(store.sidebarCollapsed).toBe(true)
    store.toggleSidebar()
    expect(store.sidebarCollapsed).toBe(false)
  })

  it('setSidebarHidden true prevents toggleSidebar', () => {
    const store = useUiStore()
    store.setSidebarHidden(true)
    store.toggleSidebar()
    expect(store.sidebarCollapsed).toBe(false)
  })

  it('setSidebarHidden true also un-collapses an already collapsed sidebar', () => {
    const store = useUiStore()
    store.toggleSidebar()
    expect(store.sidebarCollapsed).toBe(true)
    store.setSidebarHidden(true)
    expect(store.sidebarCollapsed).toBe(false)
  })

  it('setLocale changes locale', () => {
    const store = useUiStore()
    store.setLocale('en')
    expect(store.locale).toBe('en')
  })
})
