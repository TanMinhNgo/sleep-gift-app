import content from '@/content/games.json';

export type GameId = 'shuffle' | 'images' | 'walk' | 'awake' | 'breath';
export type Step = { text: string; pauseMs: number };

export const GAMES: { id: GameId; name: string; desc: string }[] = [
  { id: 'shuffle', name: 'Xáo chữ', desc: 'Mỗi chữ cái, nghĩ thật nhiều từ và hình dung từng thứ' },
  { id: 'images', name: 'Hình ảnh lạc đề', desc: 'Những hình ảnh rời rạc, chậm rãi, để tưởng tượng' },
  { id: 'walk', name: 'Dạo bước', desc: 'Dạo bộ tưởng tượng qua một khung cảnh yên bình' },
  { id: 'awake', name: 'Thử thách cố thức', desc: 'Cứ thức thảnh thơi, tuyệt đối không cố ngủ' },
  { id: 'breath', name: 'Sóng thở', desc: 'Hít vào bốn nhịp, thở ra sáu nhịp, chậm dần' },
];

export const SCENES = content.scenes;
const GAME_MS = 20 * 60_000;

/** Ước lượng thời gian một bước — chỉ để dựng đủ dài; dừng thật do player đếm giờ. */
export const estimateMs = (s: Step) => s.text.length * 70 + s.pauseMs;

function shuffle<T>(xs: T[], rng: () => number) {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const splitScene = (text: string) =>
  text
    .split(/\n|(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

function fill(steps: Step[], next: (elapsed: number) => Step | null) {
  let elapsed = steps.reduce((a, s) => a + estimateMs(s), 0);
  while (elapsed < GAME_MS) {
    const s = next(elapsed);
    if (!s) break;
    steps.push(s);
    elapsed += estimateMs(s);
  }
  return { steps, elapsed };
}

function shuffleWords(rng: () => number, extra: string[]) {
  const seen = new Set(content.words.map((w) => w.toLowerCase()));
  const words = shuffle(content.words, rng);
  // Từ của partner chen vào 10 từ đầu: một phiên chỉ đọc ~40 từ, để cuối thì không bao giờ tới.
  for (const w of shuffle(extra, rng)) {
    const k = w.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    words.splice(Math.floor(rng() * Math.min(10, words.length + 1)), 0, w.trim());
  }
  return words;
}

const AWAKE_LINES = [
  'Cứ thong thả, không cần ngủ đâu.',
  'Mắt cứ nhắm, đầu óc cứ thức nhẹ nhàng.',
  'Không cần làm gì cả.',
  'Cứ thức thêm một chút nữa cũng được.',
];
const BREATH = ['Hít vào…', 'hai…', 'ba…', 'bốn…', 'Thở ra…', 'hai…', 'ba…', 'bốn…', 'năm…', 'sáu…'];

export function buildScript(game: GameId, opts: { rng: () => number; extraWords?: string[]; scene?: string[] }): Step[] {
  const { rng } = opts;
  switch (game) {
    case 'shuffle': {
      const words = shuffleWords(rng, opts.extraWords ?? []);
      const queue: Step[] = [];
      let i = 0;
      return fill([{ text: 'Nhắm mắt lại. Mỗi chữ cái, mình nghĩ thật nhiều từ bắt đầu bằng chữ đó, và hình dung từng thứ.', pauseMs: 3000 }], () => {
        if (!queue.length) {
          if (i >= words.length) return null;
          const w = words[i++];
          queue.push({ text: `Từ: ${w}.`, pauseMs: 8000 });
          for (let n = 1; n < w.replace(/\s/g, '').length; n++) queue.push({ text: 'Chữ tiếp theo.', pauseMs: 8000 });
        }
        return queue.shift()!;
      }).steps;
    }
    case 'images': {
      const imgs = shuffle(content.images, rng);
      let i = 0;
      return fill([{ text: 'Mình sẽ đọc từng hình ảnh. Cứ để nó hiện ra, không cần nghĩ thêm.', pauseMs: 3000 }], () =>
        i < imgs.length ? { text: imgs[i++], pauseMs: 10000 } : null
      ).steps;
    }
    case 'walk': {
      const lines = opts.scene?.length ? opts.scene : content.scenes[0].lines;
      const { steps, elapsed } = fill(
        lines.map((text) => ({ text, pauseMs: 12000 })),
        () => null
      );
      // Hết lời dẫn trước 20 phút thì im lặng ở lại trong khung cảnh.
      const end = { text: 'Cứ ở lại trong khung cảnh ấy, thật chậm.', pauseMs: 0 };
      end.pauseMs = Math.max(0, GAME_MS - elapsed - estimateMs(end));
      return [...steps, end];
    }
    case 'awake': {
      let i = 0;
      return fill(
        [
          { text: 'Nằm thoải mái, nhắm mắt lại.', pauseMs: 5000 },
          { text: 'Lần này, nhiệm vụ là cứ thức, thảnh thơi. Tuyệt đối đừng cố ngủ.', pauseMs: 60000 },
        ],
        () => ({ text: AWAKE_LINES[i++ % AWAKE_LINES.length], pauseMs: 90000 })
      ).steps;
    }
    case 'breath': {
      let i = 0;
      return fill([{ text: 'Thở theo giọng đọc. Hít vào bốn nhịp, thở ra sáu nhịp.', pauseMs: 2000 }], (elapsed) => {
        // Mỗi nhịp đếm từ 0,8 giây chậm dần tới 1 giây trong 5 phút đầu → ~6 hơi thở/phút.
        const beat = 800 + 200 * Math.min(1, elapsed / (5 * 60_000));
        const text = BREATH[i++ % BREATH.length];
        return { text, pauseMs: Math.max(0, Math.round(beat - text.length * 70)) };
      }).steps;
    }
  }
}
