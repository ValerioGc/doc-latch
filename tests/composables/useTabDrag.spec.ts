import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/document';
import {
  startTabDrag,
  useDragState,
  getActiveDragTabId,
  endTabDrag,
  simulateDrop,
} from '@/composables/useTabDrag';
import type { DocumentInfo } from '@/types/pdf';

const baseInfo: DocumentInfo = {
  path: '/a.pdf',
  pageCount: 1,
  title: null,
  author: null,
  subject: null,
  creator: null,
  producer: null,
  creationDate: null,
  modDate: null,
  pdfVersion: '1.7',
  pageWidthPt: 595,
  pageHeightPt: 842,
  isEncrypted: false,
};

function makePointer(x = 0, y = 0): PointerEvent {
  return { clientX: x, clientY: y } as PointerEvent;
}

function movePointer(x: number, y: number): void {
  document.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y }));
}

describe('useTabDrag', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    endTabDrag();
    // jsdom does not implement elementFromPoint; detectZone returns null-safe defaults
    document.elementFromPoint = vi.fn().mockReturnValue(null);
  });

  describe('startTabDrag / useDragState', () => {
    it('stores tabId and label without entering dragging mode', () => {
      const state = useDragState();
      startTabDrag('t1', 'file.pdf', makePointer(100, 200));
      expect(state.tabId).toBe('t1');
      expect(state.label).toBe('file.pdf');
      expect(state.isDragging).toBe(false);
    });

    it('stores the initial pointer coordinates', () => {
      const state = useDragState();
      startTabDrag('t1', 'file.pdf', makePointer(50, 80));
      expect(state.x).toBe(50);
      expect(state.y).toBe(80);
    });
  });

  describe('getActiveDragTabId', () => {
    it('returns null before any drag starts', () => {
      expect(getActiveDragTabId()).toBeNull();
    });

    it('returns the tab id after startTabDrag', () => {
      startTabDrag('t1', 'file.pdf', makePointer());
      expect(getActiveDragTabId()).toBe('t1');
    });

    it('returns null after endTabDrag', () => {
      startTabDrag('t1', 'file.pdf', makePointer());
      endTabDrag();
      expect(getActiveDragTabId()).toBeNull();
    });
  });

  describe('pointer move threshold', () => {
    it('does not set isDragging when movement is below DRAG_THRESHOLD (5px)', () => {
      const state = useDragState();
      startTabDrag('t1', 'file.pdf', makePointer(0, 0));
      movePointer(2, 2); // √8 ≈ 2.83 < 5
      expect(state.isDragging).toBe(false);
    });

    it('sets isDragging when movement exceeds DRAG_THRESHOLD', () => {
      const state = useDragState();
      startTabDrag('t1', 'file.pdf', makePointer(0, 0));
      movePointer(6, 0); // 6 > 5
      expect(state.isDragging).toBe(true);
    });

    it('updates x/y coordinates to the new pointer position', () => {
      const state = useDragState();
      startTabDrag('t1', 'file.pdf', makePointer(0, 0));
      movePointer(10, 20);
      expect(state.x).toBe(10);
      expect(state.y).toBe(20);
    });

    it('does not reset isDragging on subsequent moves below threshold after it was set', () => {
      const state = useDragState();
      startTabDrag('t1', 'file.pdf', makePointer(0, 0));
      movePointer(10, 0);
      expect(state.isDragging).toBe(true);
      movePointer(10, 0); // same position, no new movement
      expect(state.isDragging).toBe(true);
    });
  });

  describe('Escape key', () => {
    it('cancels the drag when Escape is pressed', () => {
      const state = useDragState();
      startTabDrag('t1', 'file.pdf', makePointer(0, 0));
      movePointer(10, 0);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(state.isDragging).toBe(false);
      expect(state.tabId).toBeNull();
    });

    it('does not cancel on other keys', () => {
      const state = useDragState();
      startTabDrag('t1', 'file.pdf', makePointer(0, 0));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(state.tabId).toBe('t1');
    });
  });

  describe('endTabDrag', () => {
    it('resets all state fields to their initial values', () => {
      const state = useDragState();
      startTabDrag('t1', 'file.pdf', makePointer(0, 0));
      movePointer(10, 0);
      endTabDrag();
      expect(state.isDragging).toBe(false);
      expect(state.tabId).toBeNull();
      expect(state.label).toBe('');
      expect(state.overSplit).toBe(false);
      expect(state.overTabId).toBeNull();
    });

    it('stops responding to pointer moves after endTabDrag', () => {
      const state = useDragState();
      startTabDrag('t1', 'file.pdf', makePointer(0, 0));
      endTabDrag();
      movePointer(100, 100);
      expect(state.isDragging).toBe(false);
    });
  });

  describe('real pointer events (detectZone + onUp)', () => {
    function openSplitSetup() {
      const docStore = useDocumentStore();
      docStore.setLoading('/a.pdf');
      docStore.setReady({ ...baseInfo, path: '/a.pdf' });
      const aId = docStore.activeTabId!;
      docStore.setLoading('/b.pdf');
      docStore.setReady({ ...baseInfo, path: '/b.pdf' });
      const bId = docStore.activeTabId!;
      docStore.setActiveTab(aId);
      docStore.openSplit(); // active=aId (left), split=bId (right)
      return { docStore, aId, bId };
    }

    function dragAndDrop(tabId: string, target: Element | null): void {
      document.elementFromPoint = vi.fn().mockReturnValue(target);
      startTabDrag(tabId, 'file.pdf', makePointer(0, 0));
      document.dispatchEvent(new PointerEvent('pointermove', { clientX: 10, clientY: 0 }));
      document.dispatchEvent(new PointerEvent('pointerup', { clientX: 10, clientY: 0 }));
    }

    it('does not swap when pointerup fires without prior move (not dragging)', () => {
      const { docStore, aId } = openSplitSetup();
      document.elementFromPoint = vi.fn().mockReturnValue(null);
      startTabDrag(aId, 'a.pdf', makePointer(0, 0));

      // Release without moving → _moved stays false → onUp skips the drop logic
      document.dispatchEvent(new PointerEvent('pointerup', { clientX: 0, clientY: 0 }));

      expect(docStore.activeTabId).toBe(aId);
    });

    it('does nothing when elementFromPoint returns null', () => {
      const { docStore, aId } = openSplitSetup();
      dragAndDrop(aId, null);
      // null element → overSplit false, overTabId null → no store mutation
      expect(docStore.activeTabId).toBe(aId);
    });

    it('swaps split tabs when dragged tab is released over .split_header', () => {
      const { docStore, aId, bId } = openSplitSetup();

      const splitHeaderEl = document.createElement('div');
      splitHeaderEl.className = 'split_header';
      document.body.appendChild(splitHeaderEl);

      dragAndDrop(aId, splitHeaderEl);

      expect(docStore.activeTabId).toBe(bId);
      expect(docStore.splitTabId).toBe(aId);

      document.body.removeChild(splitHeaderEl);
    });

    it('swaps split tabs when split tab is released over a .tab_row', () => {
      const { docStore, aId, bId } = openSplitSetup();

      const tabRowEl = document.createElement('div');
      tabRowEl.className = 'tab_row';
      tabRowEl.dataset.tabId = aId;
      document.body.appendChild(tabRowEl);

      dragAndDrop(bId, tabRowEl); // drag split tab → released on tab row

      expect(docStore.activeTabId).toBe(bId);
      expect(docStore.splitTabId).toBe(aId);

      document.body.removeChild(tabRowEl);
    });

    it('reorders tabs when a non-split tab is released over a different tab row', () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/a.pdf');
      const aId = docStore.activeTabId!;
      docStore.setLoading('/b.pdf');
      docStore.setLoading('/c.pdf');
      const cId = docStore.activeTabId!;

      const tabRowEl = document.createElement('div');
      tabRowEl.className = 'tab_row';
      tabRowEl.dataset.tabId = aId;
      document.body.appendChild(tabRowEl);

      dragAndDrop(cId, tabRowEl); // drag c → drop on a's row → [c, a, b]

      expect(docStore.tabs[0].id).toBe(cId);
      expect(docStore.tabs[1].id).toBe(aId);

      document.body.removeChild(tabRowEl);
    });

    it('cancels drag on pointercancel', () => {
      const state = useDragState();
      const docStore = useDocumentStore();
      docStore.setLoading('/a.pdf');
      startTabDrag(docStore.activeTabId!, 'a.pdf', makePointer(0, 0));
      movePointer(10, 0);

      document.dispatchEvent(new PointerEvent('pointercancel'));

      expect(state.isDragging).toBe(false);
      expect(state.tabId).toBeNull();
    });
  });

  describe('simulateDrop', () => {
    it('does nothing when no drag is active', () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/a.pdf');
      const id = docStore.activeTabId!;
      simulateDrop('split');
      expect(docStore.activeTabId).toBe(id);
    });

    it('swaps split tabs when zone is "split" and dragged tab is not the split tab', () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/a.pdf');
      docStore.setReady({ ...baseInfo, path: '/a.pdf' });
      const aId = docStore.activeTabId!;
      docStore.setLoading('/b.pdf');
      docStore.setReady({ ...baseInfo, path: '/b.pdf' });
      const bId = docStore.activeTabId!;
      docStore.setActiveTab(aId);
      docStore.openSplit(); // active=aId, split=bId

      startTabDrag(aId, 'a.pdf', makePointer());
      simulateDrop('split'); // drag active tab to split zone → swap

      expect(docStore.activeTabId).toBe(bId);
      expect(docStore.splitTabId).toBe(aId);
    });

    it('does not swap when zone is "split" and dragged tab IS the split tab', () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/a.pdf');
      docStore.setReady({ ...baseInfo, path: '/a.pdf' });
      const aId = docStore.activeTabId!;
      docStore.setLoading('/b.pdf');
      docStore.setReady({ ...baseInfo, path: '/b.pdf' });
      const bId = docStore.activeTabId!;
      docStore.setActiveTab(aId);
      docStore.openSplit(); // active=aId, split=bId

      startTabDrag(bId, 'b.pdf', makePointer()); // drag split tab to split zone → no-op
      simulateDrop('split');

      expect(docStore.activeTabId).toBe(aId);
      expect(docStore.splitTabId).toBe(bId);
    });

    it('swaps split tabs when zone is "tab" and dragged tab IS the split tab', () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/a.pdf');
      docStore.setReady({ ...baseInfo, path: '/a.pdf' });
      const aId = docStore.activeTabId!;
      docStore.setLoading('/b.pdf');
      docStore.setReady({ ...baseInfo, path: '/b.pdf' });
      const bId = docStore.activeTabId!;
      docStore.setActiveTab(aId);
      docStore.openSplit(); // active=aId, split=bId

      startTabDrag(bId, 'b.pdf', makePointer()); // drag split tab to tab bar → swap
      simulateDrop('tab');

      expect(docStore.activeTabId).toBe(bId);
      expect(docStore.splitTabId).toBe(aId);
    });

    it('reorders tabs when zone is "tab" and target is a different non-split tab', () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/a.pdf');
      const aId = docStore.activeTabId!;
      docStore.setLoading('/b.pdf');
      const bId = docStore.activeTabId!;
      docStore.setLoading('/c.pdf');
      const cId = docStore.activeTabId!;

      startTabDrag(cId, 'c.pdf', makePointer());
      simulateDrop('tab', aId); // move c before a

      expect(docStore.tabs[0].id).toBe(cId);
      expect(docStore.tabs[1].id).toBe(aId);
      expect(docStore.tabs[2].id).toBe(bId);
    });

    it('does not reorder when dragged onto itself', () => {
      const docStore = useDocumentStore();
      docStore.setLoading('/a.pdf');
      const aId = docStore.activeTabId!;
      docStore.setLoading('/b.pdf');
      const bId = docStore.activeTabId!;

      startTabDrag(aId, 'a.pdf', makePointer());
      simulateDrop('tab', aId);

      expect(docStore.tabs[0].id).toBe(aId);
      expect(docStore.tabs[1].id).toBe(bId);
    });

    it('resets drag state after a drop', () => {
      const state = useDragState();
      const docStore = useDocumentStore();
      docStore.setLoading('/a.pdf');
      const aId = docStore.activeTabId!;

      startTabDrag(aId, 'a.pdf', makePointer());
      simulateDrop('tab');

      expect(state.tabId).toBeNull();
      expect(state.isDragging).toBe(false);
    });
  });
});
