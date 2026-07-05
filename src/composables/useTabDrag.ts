// Module-level singleton — tracks which tab is currently being dragged.
// Using a shared variable avoids relying on dataTransfer.types during
// dragover, which is unreliable with custom MIME types in some WebViews.
let activeDragTabId: string | null = null;

export function startTabDrag(tabId: string, e: DragEvent): void {
  activeDragTabId = tabId;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tabId);
  }
}

export function endTabDrag(): void {
  activeDragTabId = null;
}

export function getActiveDragTabId(): string | null {
  return activeDragTabId;
}
