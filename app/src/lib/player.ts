import type { Step } from './games';

export const GAME_MS = 20 * 60_000;
type Voice = { rate: number; volume: number };

/** Chậm dần và nhỏ dần tuyến tính trong 20 phút. */
export function voiceAt(elapsedMs: number): Voice {
  const f = Math.min(1, Math.max(0, elapsedMs / GAME_MS));
  return { rate: 0.9 - 0.3 * f, volume: 1 - 0.65 * f };
}

export function createPlayer(o: {
  steps: Step[];
  speak: (text: string, voice: Voice, onDone: () => void) => void;
  stop: () => void;
  onEnd: () => void;
  durationMs?: number;
}) {
  let done = false;
  let t0 = 0;
  let next: ReturnType<typeof setTimeout> | undefined;
  let hard: ReturnType<typeof setTimeout> | undefined;

  function run(i: number) {
    if (done || i >= o.steps.length) return; // hết kịch bản: im lặng chờ tới giờ
    const s = o.steps[i];
    o.speak(s.text, voiceAt(Date.now() - t0), () => {
      if (!done) next = setTimeout(() => run(i + 1), s.pauseMs);
    });
  }

  function halt() {
    done = true;
    clearTimeout(next);
    clearTimeout(hard);
    o.stop();
  }

  return {
    start() {
      t0 = Date.now();
      hard = setTimeout(() => {
        if (done) return;
        halt();
        o.onEnd();
      }, o.durationMs ?? GAME_MS);
      run(0);
    },
    cancel: halt,
  };
}
