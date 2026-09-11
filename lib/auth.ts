import { cookies } from 'next/headers';

export const ACCESS_COOKIE = 'tcm_access', REFRESH_COOKIE = 'tcm_refresh';

export function authConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

export function authConfig() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Dịch vụ đăng nhập chưa được cấu hình.');
  return { url, key };
}

export async function authFetch(path: string, body?: unknown, token?: string) {
  const c = authConfig();
  return fetch(c.url + '/auth/v1/' + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      apikey: c.key,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
}

export async function setSession(access: string, refresh: string, expires: number) {
  const jar = await cookies();
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
  jar.set(ACCESS_COOKIE, access, { ...options, maxAge: expires });
  jar.set(REFRESH_COOKIE, refresh, { ...options, maxAge: 60 * 60 * 24 * 14 });
}

export async function setLocalSession(user: { userId: string; email: string; displayName: string }) {
  const jar = await cookies();
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
  const token = 'local_' + Buffer.from(JSON.stringify(user)).toString('base64url');
  jar.set(ACCESS_COOKIE, token, { ...options, maxAge: 60 * 60 * 24 * 7 });
  jar.set(REFRESH_COOKIE, 'local_refresh', { ...options, maxAge: 60 * 60 * 24 * 14 });
}

export async function getSessionUser() {
  const jar = await cookies();
  let access = jar.get(ACCESS_COOKIE)?.value;

  // Hỗ trợ phiên đăng nhập nội bộ (Local / Tester / Demo session)
  if (access?.startsWith('local_')) {
    try {
      const raw = Buffer.from(access.slice(6), 'base64url').toString('utf8');
      const u = JSON.parse(raw);
      if (u?.userId && u?.email) {
        return {
          userId: u.userId,
          email: u.email,
          displayName: u.displayName || u.email,
          fullName: u.displayName || null,
        };
      }
    } catch {
      // Bỏ qua lỗi parse token không hợp lệ
    }
  }

  if (!authConfigured()) {
    // Mặc định trả về phiên đăng nhập của Tổ trưởng Nguyễn Thị Mai để người dùng có thể duyệt và trải nghiệm ngay
    return {
      userId: 'demo-lead-user',
      email: 'nguyenthimai@tochuyenmon.edu.vn',
      displayName: 'Nguyễn Thị Mai',
      fullName: 'Nguyễn Thị Mai',
    };
  }

  const refresh = jar.get(REFRESH_COOKIE)?.value;
  let response = access ? await authFetch('user', undefined, access) : null;
  if ((!response || response.status === 401) && refresh && !refresh.startsWith('local_')) {
    const r = await authFetch('token?grant_type=refresh_token', { refresh_token: refresh });
    if (r.ok) {
      const session = await r.json();
      access = session.access_token;
      await setSession(session.access_token, session.refresh_token, session.expires_in || 3600);
      response = await authFetch('user', undefined, access);
    }
  }
  if (!response || response.status === 401) return null;
  if (!response.ok) throw new Error('Dịch vụ đăng nhập chưa phản hồi.');
  const u = await response.json();
  if (!u.id || !u.email || !u.email_confirmed_at) return null;
  return {
    userId: u.id,
    email: u.email,
    displayName: u.user_metadata?.full_name || u.email,
    fullName: u.user_metadata?.full_name || null,
  };
}
