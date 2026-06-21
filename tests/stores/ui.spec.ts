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

  it('adjustZoom increases zoom', () => {
    const store = useUiStore()
    store.setZoom(100)
    store.adjustZoom(10)
    expect(store.zoom).toBe(110)
  })

  it('zoom is clamped to max 400', () => {
    const store = useUiStore()
    store.setZoom(400)
    store.adjustZoom(50)
    expect(store.zoom).toBe(400)
  })

  it('zoom is clamped to min 25', () => {
    const store = useUiStore()
    store.setZoom(25)
    store.adjustZoom(-50)
    expect(store.zoom).toBe(25)
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

  it('setLocale changes locale', () => {
    const store = useUiStore()
    store.setLocale('en')
    expect(store.locale).toBe('en')
  })
})
