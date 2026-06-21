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
})
