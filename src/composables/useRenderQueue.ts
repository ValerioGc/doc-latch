const MAX_CONCURRENT = 3;
let running = 0;
const queue: Array<() => Promise<void>> = [];

function drain(): void {
  while (running < MAX_CONCURRENT && queue.length > 0) {
    running++;
    const task = queue.shift()!;
    void task().finally(() => {
      running--;
      drain();
    });
  }
}

export function enqueueRender(task: () => Promise<void>, priority: 'high' | 'low' = 'low'): void {
  if (priority === 'high')
    queue.unshift(task);

  else
    queue.push(task);
  
  drain();
}
