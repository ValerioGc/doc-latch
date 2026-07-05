import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDocumentStore } from '@/stores/document'
import type { DocumentInfo } from '@/types/pdf'

const mockInfo: DocumentInfo = {
  path: '/test/doc.pdf',
  pageCount: 5,
  title: 'Test Doc',
  author: 'Author',
  subject: null,
  creator: null,
  producer: null,
  creationDate: null,
  modDate: null,
  pdfVersion: '1.7',
  pageWidthPt: 595,
  pageHeightPt: 842,
  isEncrypted: false,
}

describe('useDocumentStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initial state is idle', () => {
    const store = useDocumentStore()
    expect(store.state).toBe('idle')
    expect(store.isOpen).toBe(false)
  })

  it('setLoading transitions to loading state', () => {
    const store = useDocumentStore()
    store.setLoading('/path/doc.pdf')
    expect(store.state).toBe('loading')
    expect(store.filePath).toBe('/path/doc.pdf')
  })

  it('setReady transitions to ready with document info', () => {
    const store = useDocumentStore()
    store.setLoading('/test/doc.pdf')
    store.setReady(mockInfo)
    expect(store.state).toBe('ready')
    expect(store.isOpen).toBe(true)
    expect(store.totalPages).toBe(5)
    expect(store.currentPage).toBe(1)
  })

  it('setPage changes current page within bounds', () => {
    const store = useDocumentStore()
    store.setReady(mockInfo)
    store.setPage(3)
    expect(store.currentPage).toBe(3)
  })

  it('setPage ignores out-of-bounds values', () => {
    const store = useDocumentStore()
    store.setReady(mockInfo)
    store.setPage(0)
    expect(store.currentPage).toBe(1)
    store.setPage(99)
    expect(store.currentPage).toBe(1)
  })

  it('setPasswordRequired transitions to password-required state', () => {
    const store = useDocumentStore()
    store.setLoading('/test/doc.pdf')
    store.setPasswordRequired()
    expect(store.state).toBe('password-required')
  })

  it('setError transitions to error state with the given error', () => {
    const store = useDocumentStore()
    store.setLoading('/test/doc.pdf')
    store.setError({ kind: 'InvalidPdf', message: 'bad pdf' })
    expect(store.state).toBe('error')
    expect(store.error?.kind).toBe('InvalidPdf')
  })

  it('setError does nothing when there is no active tab', () => {
    const store = useDocumentStore()
    store.setError({ kind: 'InvalidPdf', message: 'bad pdf' })
    expect(store.state).toBe('idle')
  })

  it('close resets to idle state', () => {
    const store = useDocumentStore()
    store.setReady(mockInfo)
    store.close()
    expect(store.state).toBe('idle')
    expect(store.info).toBeNull()
    expect(store.filePath).toBeNull()
  })

  it('fileName extracts filename from path', () => {
    const store = useDocumentStore()
    store.setLoading('/some/path/documento.pdf')
    expect(store.fileName).toBe('documento.pdf')
  })

  describe('zoom', () => {
    it('defaults to 100', () => {
      const store = useDocumentStore()
      store.setReady(mockInfo)
      expect(store.zoom).toBe(100)
    })

    it('adjustZoom increases zoom', () => {
      const store = useDocumentStore()
      store.setReady(mockInfo)
      store.setZoom(100)
      store.adjustZoom(10)
      expect(store.zoom).toBe(110)
    })

    it('is clamped to max 400', () => {
      const store = useDocumentStore()
      store.setReady(mockInfo)
      store.setZoom(400)
      store.adjustZoom(50)
      expect(store.zoom).toBe(400)
    })

    it('is clamped to min 25', () => {
      const store = useDocumentStore()
      store.setReady(mockInfo)
      store.setZoom(25)
      store.adjustZoom(-50)
      expect(store.zoom).toBe(25)
    })

    it('does nothing when there is no active tab', () => {
      const store = useDocumentStore()
      store.setZoom(200)
      expect(store.zoom).toBe(100)
    })
  })

  describe('tabs', () => {
    const secondInfo: DocumentInfo = { ...mockInfo, path: '/test/second.pdf', pageCount: 2 }

    it('setLoading opens a new tab and activates it', () => {
      const store = useDocumentStore()
      store.setLoading('/test/doc.pdf')
      store.setLoading('/test/second.pdf')

      expect(store.tabs).toHaveLength(2)
      expect(store.filePath).toBe('/test/second.pdf')
    })

    it('keeps each tab state isolated', () => {
      const store = useDocumentStore()
      store.setLoading('/test/doc.pdf')
      store.setReady(mockInfo)
      store.setPage(3)
      store.setZoom(150)
      const firstTabId = store.activeTabId

      store.setLoading('/test/second.pdf')
      store.setReady(secondInfo)
      store.setPage(2)

      expect(store.currentPage).toBe(2)
      expect(store.zoom).toBe(100)

      store.setActiveTab(firstTabId!)

      expect(store.currentPage).toBe(3)
      expect(store.zoom).toBe(150)
    })

    it('focusTabByPath switches to an already open tab and returns true', () => {
      const store = useDocumentStore()
      store.setLoading('/test/doc.pdf')
      store.setReady(mockInfo)
      const firstTabId = store.activeTabId
      store.setLoading('/test/second.pdf')
      store.setReady(secondInfo)

      const found = store.focusTabByPath('/test/doc.pdf')

      expect(found).toBe(true)
      expect(store.activeTabId).toBe(firstTabId)
      expect(store.tabs).toHaveLength(2)
    })

    it('focusTabByPath returns false when the path is not open', () => {
      const store = useDocumentStore()
      store.setLoading('/test/doc.pdf')

      expect(store.focusTabByPath('/not/open.pdf')).toBe(false)
    })

    it('setActiveTab ignores unknown ids', () => {
      const store = useDocumentStore()
      store.setLoading('/test/doc.pdf')
      const activeId = store.activeTabId

      store.setActiveTab('unknown-id')

      expect(store.activeTabId).toBe(activeId)
    })

    it('cycleTab moves to the next tab and wraps around', () => {
      const store = useDocumentStore()
      store.setLoading('/test/doc.pdf')
      const firstTabId = store.activeTabId
      store.setLoading('/test/second.pdf')
      const secondTabId = store.activeTabId
      store.setLoading('/test/third.pdf')
      const thirdTabId = store.activeTabId

      store.cycleTab(1)
      expect(store.activeTabId).toBe(firstTabId)

      store.setActiveTab(secondTabId!)
      store.cycleTab(1)
      expect(store.activeTabId).toBe(thirdTabId)
    })

    it('cycleTab moves to the previous tab and wraps around', () => {
      const store = useDocumentStore()
      store.setLoading('/test/doc.pdf')
      const firstTabId = store.activeTabId
      store.setLoading('/test/second.pdf')
      const secondTabId = store.activeTabId
      store.setLoading('/test/third.pdf')
      const thirdTabId = store.activeTabId

      store.cycleTab(-1)
      expect(store.activeTabId).toBe(secondTabId)

      store.cycleTab(-1)
      expect(store.activeTabId).toBe(firstTabId)

      store.cycleTab(-1)
      expect(store.activeTabId).toBe(thirdTabId)
    })

    it('cycleTab does nothing when there are no tabs', () => {
      const store = useDocumentStore()

      store.cycleTab(1)

      expect(store.activeTabId).toBeNull()
    })

    it('closeTab removes the tab and activates a neighbor when it was active', () => {
      const store = useDocumentStore()
      store.setLoading('/test/doc.pdf')
      const firstTabId = store.activeTabId!
      store.setLoading('/test/second.pdf')
      const secondTabId = store.activeTabId!

      store.closeTab(secondTabId)

      expect(store.tabs).toHaveLength(1)
      expect(store.activeTabId).toBe(firstTabId)
    })

    it('closeTab ignores an unknown id', () => {
      const store = useDocumentStore()
      store.setLoading('/test/doc.pdf')

      store.closeTab('unknown-id')

      expect(store.tabs).toHaveLength(1)
    })

    it('closeTab leaves the active tab untouched when closing a background tab', () => {
      const store = useDocumentStore()
      store.setLoading('/test/doc.pdf')
      const firstTabId = store.activeTabId!
      store.setLoading('/test/second.pdf')
      const secondTabId = store.activeTabId!

      store.closeTab(firstTabId)

      expect(store.tabs).toHaveLength(1)
      expect(store.activeTabId).toBe(secondTabId)
    })

    it('closing the last tab returns to the idle state', () => {
      const store = useDocumentStore()
      store.setLoading('/test/doc.pdf')

      store.close()

      expect(store.tabs).toHaveLength(0)
      expect(store.activeTabId).toBeNull()
      expect(store.state).toBe('idle')
    })

    it('close() closes the active tab', () => {
      const store = useDocumentStore()
      store.setLoading('/test/doc.pdf')
      store.setLoading('/test/second.pdf')
      const secondTabId = store.activeTabId

      store.close()

      expect(store.tabs).toHaveLength(1)
      expect(store.activeTabId).not.toBe(secondTabId)
    })
  })

  describe('newTab', () => {
    it('opens an empty idle tab and activates it', () => {
      const store = useDocumentStore()
      store.setLoading('/test/doc.pdf')
      const firstTabId = store.activeTabId

      store.newTab()

      expect(store.tabs).toHaveLength(2)
      expect(store.activeTabId).not.toBe(firstTabId)
      expect(store.state).toBe('idle')
      expect(store.filePath).toBeNull()
    })

    it('setLoading fills the active empty tab instead of opening a new one', () => {
      const store = useDocumentStore()
      store.setLoading('/test/doc.pdf')
      const firstTabId = store.activeTabId
      store.newTab()
      const placeholderTabId = store.activeTabId

      store.setLoading('/test/second.pdf')

      expect(store.tabs).toHaveLength(2)
      expect(store.activeTabId).toBe(placeholderTabId)
      expect(store.activeTabId).not.toBe(firstTabId)
      expect(store.state).toBe('loading')
      expect(store.filePath).toBe('/test/second.pdf')
    })

    it('setLoading opens a new tab when the active tab already has a document', () => {
      const store = useDocumentStore()
      store.setLoading('/test/doc.pdf')

      store.setLoading('/test/second.pdf')

      expect(store.tabs).toHaveLength(2)
      expect(store.filePath).toBe('/test/second.pdf')
    })
  })

  describe('split view', () => {
    const secondInfo: DocumentInfo = { ...mockInfo, path: '/test/second.pdf', pageCount: 2 }

    function openTwoReadyTabs() {
      const store = useDocumentStore()
      store.setLoading('/test/doc.pdf')
      store.setReady(mockInfo)
      const firstTabId = store.activeTabId!
      store.setLoading('/test/second.pdf')
      store.setReady(secondInfo)
      const secondTabId = store.activeTabId!
      return { store, firstTabId, secondTabId }
    }

    it('getTab returns the matching tab, or null', () => {
      const { store, firstTabId } = openTwoReadyTabs()

      expect(store.getTab(firstTabId)?.filePath).toBe('/test/doc.pdf')
      expect(store.getTab('unknown-id')).toBeNull()
    })

    it('openSplit shows the first tab other than the active one', () => {
      const { store, firstTabId, secondTabId } = openTwoReadyTabs()
      expect(store.activeTabId).toBe(secondTabId)

      store.openSplit()

      expect(store.splitEnabled).toBe(true)
      expect(store.splitTabId).toBe(firstTabId)
    })

    it('openSplit works even when the candidate tab has no document loaded', () => {
      const store = useDocumentStore()
      store.setLoading('/test/doc.pdf')
      store.setReady(mockInfo)
      store.newTab() // second tab: idle, no document

      store.openSplit()

      expect(store.splitEnabled).toBe(true)
    })

    it('openSplit does nothing when there is no other tab', () => {
      const store = useDocumentStore()
      store.setLoading('/test/doc.pdf')
      store.setReady(mockInfo)

      store.openSplit()

      expect(store.splitEnabled).toBe(false)
    })

    it('closeSplit closes the split pane', () => {
      const { store } = openTwoReadyTabs()
      store.openSplit()

      store.closeSplit()

      expect(store.splitEnabled).toBe(false)
      expect(store.splitTabId).toBeNull()
    })

    it('toggleSplit opens then closes the split pane', () => {
      const { store } = openTwoReadyTabs()

      store.toggleSplit()
      expect(store.splitEnabled).toBe(true)

      store.toggleSplit()
      expect(store.splitEnabled).toBe(false)
    })

    it('setActiveTab swaps the panes instead of closing the split when activating the tab shown there', () => {
      const { store, firstTabId, secondTabId } = openTwoReadyTabs()
      store.openSplit()
      expect(store.splitTabId).toBe(firstTabId)

      store.setActiveTab(firstTabId)

      expect(store.splitEnabled).toBe(true)
      expect(store.activeTabId).toBe(firstTabId)
      expect(store.splitTabId).toBe(secondTabId)
    })

    it('cycleTab swaps the panes instead of closing the split when cycling onto the tab shown there', () => {
      const { store, firstTabId, secondTabId } = openTwoReadyTabs()
      store.openSplit()
      expect(store.splitTabId).toBe(firstTabId)

      store.cycleTab(1)

      expect(store.activeTabId).toBe(firstTabId)
      expect(store.splitEnabled).toBe(true)
      expect(store.splitTabId).toBe(secondTabId)
    })

    it('closeTab closes the split pane if it closes the tab shown there', () => {
      const { store, firstTabId } = openTwoReadyTabs()
      store.openSplit()

      store.closeTab(firstTabId)

      expect(store.splitEnabled).toBe(false)
      expect(store.splitTabId).toBeNull()
    })

    it('swapSplitTabs swaps the active and split pane tabs', () => {
      const { store, firstTabId, secondTabId } = openTwoReadyTabs()
      store.openSplit()
      expect(store.activeTabId).toBe(secondTabId)
      expect(store.splitTabId).toBe(firstTabId)

      store.swapSplitTabs()

      expect(store.activeTabId).toBe(firstTabId)
      expect(store.splitTabId).toBe(secondTabId)
    })

    it('swapSplitTabs does nothing when split is not open', () => {
      const { store, secondTabId } = openTwoReadyTabs()

      store.swapSplitTabs()

      expect(store.activeTabId).toBe(secondTabId)
      expect(store.splitTabId).toBeNull()
    })

    it('closeTab falls back to closing the split pane if the reassigned active tab cannot replace it', () => {
      // Closing the active tab can force-activate its neighbor, which may be
      // the tab currently shown in the split pane. The just-closed tab can't
      // take its place there, so the split pane closes instead of swapping.
      const store = useDocumentStore()
      store.setLoading('/test/doc.pdf')
      store.setReady(mockInfo)
      const firstTabId = store.activeTabId!
      store.setLoading('/test/second.pdf')
      store.setReady(secondInfo)
      const secondTabId = store.activeTabId!
      store.setActiveTab(firstTabId)
      store.openSplit()
      expect(store.splitTabId).toBe(secondTabId)

      store.closeTab(firstTabId)

      expect(store.activeTabId).toBe(secondTabId)
      expect(store.splitEnabled).toBe(false)
    })
  })
})
