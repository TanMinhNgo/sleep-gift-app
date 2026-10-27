import { api, ApiError } from './api';
import { scheduleReminders } from './reminders';
import { getSetting, setSetting } from './settings';
import * as store from './store';
import { syncSleeper } from './sync';

jest.mock('./session', () => ({ getToken: jest.fn(async () => 't') }));
jest.mock('./api', () => ({ ...jest.requireActual('./api'), api: jest.fn() }));
jest.mock('./reminders', () => ({ scheduleReminders: jest.fn(async () => undefined) }));
jest.mock('./store', () => ({
  dirtyLogs: jest.fn(() => []),
  markClean: jest.fn(),
  upsertServerLogs: jest.fn(),
  replaceNotes: jest.fn(),
  listLogs: jest.fn(() => []),
}));
const mockSettings = new Map<string, string>();
jest.mock('./settings', () => ({
  getSetting: jest.fn((k: string) => mockSettings.get(k) ?? null),
  setSetting: jest.fn((k: string, v: string) => mockSettings.set(k, v)),
}));

const apiMock = api as jest.Mock;
const now = new Date(2026, 9, 27, 8, 0);
const dirty = {
  date: '2026-10-27',
  bed_time: '2026-10-26T15:30:00.000Z',
  wake_time: '2026-10-26T23:30:00.000Z',
  latency_min: 15,
  awakenings: 1,
  awake_min: 5,
  rating: 4,
  note: null,
  updated_at: '2026-10-27T00:00:01.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSettings.clear();
  apiMock.mockImplementation(async (method: string) => (method === 'PUT' ? { applied: true } : []));
});

it('pushes dirty logs with original updated_at', async () => {
  (store.dirtyLogs as jest.Mock).mockReturnValueOnce([dirty]);
  await syncSleeper(now);
  const [method, path, body] = apiMock.mock.calls[0];
  expect([method, path]).toEqual(['PUT', '/logs/2026-10-27']);
  expect(body.updated_at).toBe(dirty.updated_at);
  expect(body).not.toHaveProperty('date');
  expect(body).not.toHaveProperty('note'); // API không nhận null
  expect(store.markClean).toHaveBeenCalledWith('2026-10-27', dirty.updated_at);
});

it('applied:false still marks clean', async () => {
  (store.dirtyLogs as jest.Mock).mockReturnValueOnce([dirty]);
  apiMock.mockResolvedValueOnce({ applied: false });
  await syncSleeper(now);
  expect(store.markClean).toHaveBeenCalledWith('2026-10-27', dirty.updated_at);
});

it('network keeps dirty', async () => {
  (store.dirtyLogs as jest.Mock).mockReturnValueOnce([dirty]);
  apiMock.mockRejectedValue(new ApiError(0, 'network'));
  await expect(syncSleeper(now)).resolves.toEqual({ offline: true });
  expect(store.markClean).not.toHaveBeenCalled();
  expect(scheduleReminders).toHaveBeenCalled();
});

it('a rejected log does not block the others', async () => {
  (store.dirtyLogs as jest.Mock).mockReturnValueOnce([dirty, { ...dirty, date: '2026-10-26' }]);
  apiMock.mockRejectedValueOnce(new ApiError(400, 'bad'));
  await syncSleeper(now);
  expect(store.markClean).toHaveBeenCalledTimes(1);
  expect(store.markClean).toHaveBeenCalledWith('2026-10-26', dirty.updated_at);
});

it('pulls 30 days of logs then 7 days of notes', async () => {
  await syncSleeper(now);
  expect(apiMock).toHaveBeenCalledWith('GET', '/logs?from=2026-09-28&to=2026-10-27');
  expect(apiMock).toHaveBeenCalledWith('GET', '/notes?from=2026-10-27&to=2026-11-03');
});

it('notes overwrite range', async () => {
  await syncSleeper(now);
  expect(store.replaceNotes).toHaveBeenCalledWith('2026-10-27', '2026-11-03', []);
});

it('adjusts window and saves it', async () => {
  await syncSleeper(now);
  expect(setSetting).toHaveBeenCalledWith('window_min', '480');
  expect(setSetting).toHaveBeenCalledWith('window_since', '2026-10-27');
  expect(getSetting('window_min')).toBe('480');
});
