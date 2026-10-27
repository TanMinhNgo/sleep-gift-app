import content from '@/content/games.json';

import { buildScript, estimateMs, splitScene, type GameId } from './games';

// rng cố định để test lặp lại được
function seeded(seed = 1) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}
const MIN20 = 20 * 60_000;
const total = (steps: { text: string; pauseMs: number }[]) => steps.reduce((a, s) => a + estimateMs(s), 0);
const spokenWords = (steps: { text: string }[]) =>
  steps.filter((s) => s.text.startsWith('Từ: ')).map((s) => s.text.slice(4).replace(/\.$/, ''));

it('content sizes', () => {
  expect(content.words.length).toBeGreaterThanOrEqual(300);
  expect(content.images.length).toBeGreaterThanOrEqual(200);
  expect(content.scenes).toHaveLength(5);
  expect(new Set(content.words).size).toBe(content.words.length);
  for (const banned of ['thi', 'tiền', 'deadline', 'bệnh']) expect(content.words).not.toContain(banned);
});

it('no repeated word in a session', () => {
  const extra = [content.words[0].toUpperCase(), 'đồi thông'];
  const words = spokenWords(buildScript('shuffle', { rng: seeded(), extraWords: extra })).map((w) => w.toLowerCase());
  expect(new Set(words).size).toBe(words.length);
});

it('mixes partner words into the first 10', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const words = spokenWords(buildScript('shuffle', { rng: seeded(seed), extraWords: ['đồi thông'] }));
    expect(words.slice(0, 10)).toContain('đồi thông');
  }
});

it('shuffle cadence', () => {
  const steps = buildScript('shuffle', { rng: seeded() });
  const next = steps.filter((s) => s.text === 'Chữ tiếp theo.');
  expect(next.length).toBeGreaterThan(0);
  expect(next.every((s) => s.pauseMs === 8000)).toBe(true);
});

it('images 10s apart', () => {
  const steps = buildScript('images', { rng: seeded() });
  expect(steps.slice(1).every((s) => s.pauseMs === 10000)).toBe(true);
});

it.each<GameId>(['shuffle', 'images', 'walk', 'awake', 'breath'])('long enough: %s', (g) => {
  expect(total(buildScript(g, { rng: seeded(), scene: content.scenes[0].lines }))).toBeGreaterThanOrEqual(MIN20);
});

it('scene split', () => {
  expect(splitScene('Gió nhẹ. Lá rơi\nTrời xanh.')).toEqual(['Gió nhẹ.', 'Lá rơi', 'Trời xanh.']);
  expect(splitScene('   ')).toEqual([]);
  expect(total(buildScript('walk', { rng: seeded(), scene: splitScene('Một câu thôi.') }))).toBeGreaterThanOrEqual(MIN20);
});
