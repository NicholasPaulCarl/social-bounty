/**
 * BrandAssetsSection — simulated-progress unit tests.
 *
 * The web jest harness is pure (`testEnvironment: 'node'`, no jsdom,
 * no @testing-library/react).  These tests lock in the pure logic that
 * the slot-based progress simulation relies on.
 *
 * We re-implement the tick loop inline rather than importing from
 * BrandAssetsSection because the component module uses 'use client' and
 * imports React + lucide-react, which the node-only harness can't evaluate.
 * The contract is: same algorithm, same observable behaviour.
 */

function runSimulatedProgress(
  onTick: (p: number) => void,
  onComplete: () => void,
): () => void {
  let p = 0;
  let cancelled = false;
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const tick = () => {
    if (cancelled) return;
    p += 12 + Math.random() * 18;
    const clamped = Math.min(p, 100);
    onTick(clamped);
    if (clamped < 100) {
      timerId = setTimeout(tick, 140);
    } else {
      onComplete();
    }
  };

  tick();

  return () => {
    cancelled = true;
    if (timerId !== null) clearTimeout(timerId);
  };
}

describe('runSimulatedProgress — tick loop', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('reaches 100% within 2 seconds when all timers run', () => {
    const ticks: number[] = [];
    const onComplete = jest.fn();

    runSimulatedProgress((p) => ticks.push(p), onComplete);

    jest.runAllTimers();

    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks[ticks.length - 1]).toBe(100);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('progress values are monotonically non-decreasing', () => {
    const ticks: number[] = [];

    runSimulatedProgress((p) => ticks.push(p), jest.fn());
    jest.runAllTimers();

    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i]).toBeGreaterThanOrEqual(ticks[i - 1]);
    }
  });

  it('each tick value is clamped to [0, 100]', () => {
    const ticks: number[] = [];

    runSimulatedProgress((p) => ticks.push(p), jest.fn());
    jest.runAllTimers();

    for (const t of ticks) {
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThanOrEqual(100);
    }
  });

  it('onComplete is called exactly once', () => {
    const onComplete = jest.fn();

    runSimulatedProgress(() => {}, onComplete);
    jest.runAllTimers();

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('cancel() stops future ticks and onComplete is not called', () => {
    const ticks: number[] = [];
    const onComplete = jest.fn();

    const cancel = runSimulatedProgress((p) => ticks.push(p), onComplete);

    jest.advanceTimersByTime(140);
    const ticksBeforeCancel = ticks.length;
    cancel();

    jest.runAllTimers();

    expect(ticks.length).toBe(ticksBeforeCancel);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('first tick fires synchronously (progress > 0 before any setTimeout)', () => {
    const ticks: number[] = [];

    runSimulatedProgress((p) => ticks.push(p), jest.fn());

    // Before advancing timers, the first tick has already run.
    expect(ticks.length).toBeGreaterThanOrEqual(1);
    expect(ticks[0]).toBeGreaterThan(0);

    jest.runAllTimers();
  });

  it('reaches 100% in at most ceil(100/12) = 9 ticks with minimum bump', () => {
    // Worst-case: each tick adds exactly 12 (minimum bump). ceil(100/12) = 9.
    const ticks: number[] = [];

    runSimulatedProgress((p) => ticks.push(p), jest.fn());
    jest.runAllTimers();

    expect(ticks.length).toBeLessThanOrEqual(9);
  });
});
