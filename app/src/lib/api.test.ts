import { api, ApiError, errorMessage, normalizeCode, setUnauthorizedHandler } from './api';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => 'tok'),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { hostUri: '192.168.1.5:8081' } },
}));

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

function respond(status: number, body: string) {
  fetchMock.mockResolvedValueOnce(new Response(status === 204 ? null : body, { status }));
}

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = 'https://x.test';
  fetchMock.mockReset();
  setUnauthorizedHandler(() => {});
});

it('sends bearer and json', async () => {
  respond(200, '{"ok":true}');
  await expect(api('PATCH', '/me', { name: 'A' })).resolves.toEqual({ ok: true });
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe('https://x.test/me');
  expect(init.method).toBe('PATCH');
  expect(init.headers).toEqual({ Authorization: 'Bearer tok', 'content-type': 'application/json' });
  expect(init.body).toBe('{"name":"A"}');
});

it('dev: localhost becomes the LAN IP of the Metro host', async () => {
  process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';
  respond(200, '{}');
  await api('GET', '/me');
  expect(fetchMock.mock.calls[0][0]).toBe('http://192.168.1.5:3000/me');
});

it('returns undefined on 204', async () => {
  respond(204, '');
  await expect(api('DELETE', '/notes/1')).resolves.toBeUndefined();
});

it('maps error body', async () => {
  respond(400, '{"error":"invalid code"}');
  await expect(api('POST', '/join', {})).rejects.toMatchObject({ status: 400, error: 'invalid code' });
});

it('non-JSON error body', async () => {
  respond(504, '<html>');
  await expect(api('GET', '/me')).rejects.toMatchObject({ status: 504, error: 'internal' });
});

it('network failure', async () => {
  fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
  const e = await api('GET', '/me').catch((x) => x);
  expect(e).toBeInstanceOf(ApiError);
  expect(e).toMatchObject({ status: 0, error: 'network' });
});

it('401 calls handler', async () => {
  const handler = jest.fn();
  setUnauthorizedHandler(handler);
  respond(401, '{"error":"unauthorized"}');
  await expect(api('GET', '/me')).rejects.toMatchObject({ status: 401 });
  expect(handler).toHaveBeenCalledTimes(1);
});

it('401 without token (wrong admin secret) skips handler', async () => {
  const SecureStore = jest.requireMock('expo-secure-store');
  SecureStore.getItemAsync.mockResolvedValueOnce(null);
  const handler = jest.fn();
  setUnauthorizedHandler(handler);
  respond(401, '{"error":"unauthorized"}');
  await expect(api('POST', '/register', {})).rejects.toMatchObject({ status: 401 });
  expect(handler).not.toHaveBeenCalled();
});

it('errorMessage', () => {
  expect(errorMessage(new ApiError(400, 'invalid code'))).toBe('Mã không đúng hoặc đã hết hạn');
  expect(errorMessage(new ApiError(0, 'network'))).toBe('Không có mạng, thử lại nhé');
  expect(errorMessage(new ApiError(401, 'unauthorized'))).toBe('Admin secret không đúng');
  expect(errorMessage(new ApiError(500, 'weird'))).toBe('Có lỗi xảy ra, thử lại sau');
  expect(errorMessage(new Error('x'))).toBe('Có lỗi xảy ra, thử lại sau');
});

it('normalizeCode', () => {
  expect(normalizeCode('123 456')).toBe('123456');
  expect(normalizeCode('12-34-5678')).toBe('123456');
  expect(normalizeCode('abc')).toBe('');
});
