import { describe, it, expect, vi } from 'vitest';
import { enqueueRender } from '@/composables/useRenderQueue';

describe('useRenderQueue', () => {
  it('executes a low-priority task (default)', async () => {
    const task = vi.fn().mockResolvedValue(undefined);
    enqueueRender(task);
    await vi.waitFor(() => expect(task).toHaveBeenCalledTimes(1));
  });

  it('executes a high-priority task', async () => {
    const task = vi.fn().mockResolvedValue(undefined);
    enqueueRender(task, 'high');
    await vi.waitFor(() => expect(task).toHaveBeenCalledTimes(1));
  });

  it('high-priority task is placed at the front of the pending queue', async () => {
    const order: string[] = [];

    // Fill all 3 concurrent slots to prevent immediate draining
    const unblock: Array<() => void> = [];
    Array.from({ length: 3 }, () =>
      enqueueRender(
        () =>
          new Promise<void>((resolve) => {
            unblock.push(resolve);
          }),
      ),
    );

    // Wait until all 3 slots are occupied
    await vi.waitFor(() => expect(unblock).toHaveLength(3));

    // Queue two tasks while slots are busy — high-priority goes first in queue
    let lowResolve: () => void;
    let highResolve: () => void;

    enqueueRender(() => {
      order.push('low');
      return new Promise<void>((r) => {
        lowResolve = r;
      });
    }, 'low');

    enqueueRender(() => {
      order.push('high');
      return new Promise<void>((r) => {
        highResolve = r;
      });
    }, 'high');

    // Release one slot — high task should start first
    unblock[0]();
    await vi.waitFor(() => expect(order).toHaveLength(1));
    expect(order[0]).toBe('high');

    // Clean up: release everything
    highResolve!();
    unblock[1]();
    unblock[2]();
    await vi.waitFor(() => expect(order).toHaveLength(2));
    lowResolve!();
  });
});
