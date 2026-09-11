import { cookies } from 'next/headers';
import {
  authConfigured,
  authFetch,
  setSession,
  setLocalSession,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    configured: true,
    supabaseAuth: authConfigured(),
    databaseConfigured: true,
    storageConfigured: true,
  });
}

export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== new URL(req.url).origin) {
      return Response.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403 });
    }
    const b = await req.json();

    if (b.action === 'logout') {
      const jar = await cookies();
      jar.delete(ACCESS_COOKIE);
      jar.delete(REFRESH_COOKIE);
      return Response.json({ ok: true });
    }

    if (b.action === 'switchPersona') {
      const personas: Record<string, { email: string; name: string }> = {
        lead: { email: 'nguyenthimai@tochuyenmon.edu.vn', name: 'Nguyễn Thị Mai' },
        deputy: { email: 'nguyenvanan@tochuyenmon.edu.vn', name: 'Nguyễn Văn An' },
        teacher: { email: 'tranthihuong@tochuyenmon.edu.vn', name: 'Trần Thị Hương' },
        bgh: { email: 'bgh@tochuyenmon.edu.vn', name: 'Ban Giám Hiệu' },
      };
      const persona = personas[b.persona || 'lead'] || personas.lead;
      await setLocalSession({
        userId: 'persona-' + (b.persona || 'lead'),
        email: persona.email,
        displayName: persona.name,
      });
      return Response.json({ ok: true });
    }

    if (!['login', 'signup'].includes(b.action)) {
      return Response.json({ error: 'Thao tác không hợp lệ.' }, { status: 400 });
    }

    if (typeof b.email !== 'string' || !/^\S+@\S+\.\S+$/.test(b.email)) {
      return Response.json({ error: 'Vui lòng nhập địa chỉ email hợp lệ.' }, { status: 400 });
    }

    // Nếu đã cấu hình Supabase Auth thực tế
    if (authConfigured()) {
      if (typeof b.password !== 'string' || b.password.length < 8 || b.password.length > 128) {
        return Response.json({ error: 'Mật khẩu từ 8 đến 128 ký tự.' }, { status: 400 });
      }

      const r = await authFetch(
        b.action === 'signup' ? 'signup' : 'token?grant_type=password',
        {
          email: b.email.trim().toLowerCase(),
          password: b.password,
          ...(b.action === 'signup' ? { data: { full_name: String(b.name || '').slice(0, 100) } } : {}),
        }
      );
      const result = await r.json();
      if (!r.ok) {
        return Response.json(
          {
            error:
              r.status === 429
                ? 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.'
                : b.action === 'login'
                ? 'Email, mật khẩu chưa đúng hoặc email chưa được xác nhận.'
                : 'Chưa thể đăng ký. Hãy kiểm tra email hoặc thử lại sau.',
          },
          { status: r.status === 429 ? 429 : 400 }
        );
      }
      if (result.access_token) {
        await setSession(result.access_token, result.refresh_token, result.expires_in || 3600);
        return Response.json({ ok: true });
      }
      return Response.json({ ok: true, confirmEmail: true });
    }

    // Khi chưa kết nối Supabase Cloud: Cho phép đăng nhập nội bộ tức thì
    const email = b.email.trim().toLowerCase();
    const name = String(b.name || email.split('@')[0]).slice(0, 100);
    await setLocalSession({
      userId: 'local-user-' + Math.random().toString(36).slice(2, 9),
      email,
      displayName: name,
    });
    return Response.json({ ok: true });
  } catch (err: any) {
    return Response.json(
      { error: err?.message || 'Chưa thể hoàn tất đăng nhập. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
