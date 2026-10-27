import { createPlayer, GAME_MS, voiceAt } from './player';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

function setup(steps: { text: string; pauseMs: number }[]) {
  const speak = jest.fn((_t: string, _v: { rate: number; volume: number }, onDone: () => void) => onDone());
  const stop = jest.fn();
  const onEnd = jest.fn();
  const p = createPlayer({ steps, speak, stop, onEnd });
  return { p, speak, stop, onEnd };
}
const many = Array.from({ length: 5000 }, (_, i) => ({ text: `b${i}`, pauseMs: 1000 }));

it('voice slows and softens', () => {
  expect(voiceAt(0)).toEqual({ rate: 0.9, volume: 1 });
  const mid = voiceAt(GAME_MS / 2);
  expect(mid.rate).toBeCloseTo(0.75);
  expect(mid.volume).toBeCloseTo(0.675);
  const end = voiceAt(GAME_MS * 2);
  expect(end.rate).toBeCloseTo(0.6);
  expect(end.volume).toBeCloseTo(0.35);
});

it('passes the current voice to speak', () => {
  const { p, speak } = setup(many);
  p.start();
  jest.advanceTimersByTime(GAME_MS / 2);
  const last = speak.mock.calls.at(-1)![1];
  expect(last.rate).toBeLessThan(0.9);
  expect(last.rate).toBeGreaterThan(0.6);
});

it('stops exactly at 20 minutes', () => {
  const { p, stop, onEnd } = setup(many);
  p.start();
  jest.advanceTimersByTime(GAME_MS - 1);
  expect(onEnd).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(onEnd).toHaveBeenCalledTimes(1);
  expect(stop).toHaveBeenCalled();
  jest.advanceTimersByTime(GAME_MS);
  expect(onEnd).toHaveBeenCalledTimes(1);
});

it('silent wait when script ends early', () => {
  const { p, speak, onEnd } = setup([{ text: 'một câu', pauseMs: 1000 }]);
  p.start();
  jest.advanceTimersByTime(60_000);
  expect(speak).toHaveBeenCalledTimes(1);
  expect(onEnd).not.toHaveBeenCalled();
  jest.advanceTimersByTime(GAME_MS);
  expect(onEnd).toHaveBeenCalledTimes(1);
});

it('cancel stops without onEnd', () => {
  const { p, speak, stop, onEnd } = setup(many);
  p.start();
  jest.advanceTimersByTime(5 * 60_000);
  const n = speak.mock.calls.length;
  p.cancel();
  expect(stop).toHaveBeenCalled();
  jest.advanceTimersByTime(GAME_MS);
  expect(speak).toHaveBeenCalledTimes(n);
  expect(onEnd).not.toHaveBeenCalled();
});
