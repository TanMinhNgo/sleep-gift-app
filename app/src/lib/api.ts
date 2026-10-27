import Constants from 'expo-constants';

import { getToken } from './session';

function baseUrl() {
  const url = process.env.EXPO_PUBLIC_API_URL ?? '';
  // Dev trên điện thoại: "localhost" là chính điện thoại → thay bằng IP LAN của máy chạy Metro.
  // Bản build release không có hostUri nên URL giữ nguyên.
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return host ? url.replace(/\/\/(localhost|127\.0\.0\.1)(?=[:/]|$)/, `//${host}`) : url;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public error: string
  ) {
    super(error);
  }
}

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

export async function api<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['content-type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'network');
  }

  if (res.status === 204) return undefined as T;
  // Vercel trả trang HTML khi 500/504 — không được để lỗi parse lọt ra.
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // Không có token = đang register sai secret, không phải token bị thu hồi.
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(res.status, typeof data?.error === 'string' ? data.error : 'internal');
  }
  return data as T;
}

const MESSAGES: Record<string, string> = {
  'invalid code': 'Mã không đúng hoặc đã hết hạn',
  network: 'Không có mạng, thử lại nhé',
  unauthorized: 'Admin secret không đúng',
};

export function errorMessage(e: unknown): string {
  return (e instanceof ApiError && MESSAGES[e.error]) || 'Có lỗi xảy ra, thử lại sau';
}

export const normalizeCode = (input: string) => input.replace(/\D/g, '').slice(0, 6);
