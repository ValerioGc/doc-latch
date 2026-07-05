import { reactive, readonly } from 'vue';
import { useDocumentStore } from '@/stores/document';

export interface TabDragState {
  isDragging: boolean;
  tabId: string | null;
  label: string;
  x: number;
  y: number;
  overSplit: boolean;
  overTabId: string | null;
}

const DRAG_THRESHOLD = 5;

const _state = reactive<TabDragState>({
  isDragging: false,
  tabId: null,
  label: '',
  x: 0,
  y: 0,
  overSplit: false,
  overTabId: null,
});

let _startX = 0;
let _startY = 0;
let _moved = false;

function detectZone(x: number, y: number): Pick<TabDragState, 'overSplit' | 'overTabId'> {
  const el = document.elementFromPoint(x, y);
  if (!el) return { overSplit: false, overTabId: null };
  if (el.closest('.split_header')) return { overSplit: true, overTabId: null };
  const row = el.closest<HTMLElement>('.tab_row');
  return { overSplit: false, overTabId: row?.dataset.tabId ?? null };
}

function onMove(e: PointerEvent): void {
  const dx = e.clientX - _startX;
  const dy = e.clientY - _startY;
  if (!_moved && dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
  _moved = true;
  _state.isDragging = true;
  _state.x = e.clientX;
  _state.y = e.clientY;
  const { overSplit, overTabId } = detectZone(e.clientX, e.clientY);
  _state.overSplit = overSplit;
  _state.overTabId = overTabId;
}

function onUp(e: PointerEvent): void {
  if (_moved && _state.tabId) {
    const { overSplit, overTabId } = detectZone(e.clientX, e.clientY);
    const docStore = useDocumentStore();
    const draggedId = _state.tabId;
    if (overSplit && draggedId !== docStore.splitTabId)
      docStore.swapSplitTabs();
    else if (overTabId && draggedId === docStore.splitTabId)
      docStore.swapSplitTabs();
    // Eat the click that fires right after pointerup so the button doesn't trigger
    document.addEventListener('click', (ev) => ev.stopImmediatePropagation(), {
      capture: true,
      once: true,
    });
  }
  reset();
}

function onCancel(): void {
  reset();
}

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') reset();
}

function reset(): void {
  _state.isDragging = false;
  _state.tabId = null;
  _state.label = '';
  _state.overSplit = false;
  _state.overTabId = null;
  _moved = false;
  document.removeEventListener('pointermove', onMove);
  document.removeEventListener('pointerup', onUp);
  document.removeEventListener('pointercancel', onCancel);
  document.removeEventListener('keydown', onKey);
  document.body.style.userSelect = '';
}

export function startTabDrag(tabId: string, label: string, e: PointerEvent): void {
  _state.tabId = tabId;
  _state.label = label;
  _state.x = e.clientX;
  _state.y = e.clientY;
  _startX = e.clientX;
  _startY = e.clientY;
  _moved = false;
  _state.isDragging = false;
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
  document.addEventListener('pointercancel', onCancel);
  document.addEventListener('keydown', onKey);
  document.body.style.userSelect = 'none';
}

export function useDragState(): Readonly<TabDragState> {
  return readonly(_state);
}

// ── Test helpers ──────────────────────────────────────────────────────────────

export function getActiveDragTabId(): string | null {
  return _state.tabId;
}

export function endTabDrag(): void {
  reset();
}

export function simulateDrop(zone: 'split' | 'tab'): void {
  if (!_state.tabId) return;
  const docStore = useDocumentStore();
  const draggedId = _state.tabId;
  reset();
  if (zone === 'split' && draggedId !== docStore.splitTabId)
    docStore.swapSplitTabs();
  else if (zone === 'tab' && draggedId === docStore.splitTabId)
    docStore.swapSplitTabs();
}
