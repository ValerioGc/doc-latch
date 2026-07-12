export function useWheelGesture(
  scrollEl: { readonly value: HTMLElement | null },
  onZoom: (delta: number) => void,
) {
  function onWheel(e: WheelEvent): void {
    e.preventDefault();
    if (e.ctrlKey) {
      const rawDelta = Math.max(1, Math.round(Math.abs(e.deltaY) / 10));
      onZoom(e.deltaY < 0 ? rawDelta : -rawDelta);
    } else {
      scrollEl.value?.scrollBy?.(e.deltaX, e.deltaY);
    }
  }

  return { onWheel };
}
