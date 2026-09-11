'use client';
import { useEffect, useState } from 'react';
import { BookOpen, ArrowRight, ShieldCheck, UserCheck, GraduationCap, Eye } from 'lucide-react';

export default function SignIn() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function switchPersona(persona: string) {
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'switchPersona', persona }),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      location.assign('/');
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    const form = new FormData(e.currentTarget);
    try {
      const r = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          email: form.get('email'),
          password: form.get('password'),
          name: form.get('name'),
        }),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      if (b.confirmEmail) {
        setMessage('Hãy kiểm tra email để xác nhận tài khoản, sau đó quay lại đăng nhập.');
      } else {
        location.assign('/');
      }
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="signin-page">
      <div className="panel signin-card" style={{ maxWidth: '520px', width: '100%' }}>
        <a href="/" className="brand">
          <span className="brand-symbol">
            <BookOpen />
          </span>
          Tổ Chuyên Môn 360
        </a>
        <h1>{mode === 'login' ? 'Chào mừng Quý Thầy/Cô' : 'Tạo tài khoản giáo viên'}</h1>
        <p>Cùng nhau xây dựng và phát triển chuyên môn vững vàng.</p>

        <div className="persona-box" style={{
          background: 'var(--panel-alt, #f8fbf9)',
          border: '1px solid var(--border, #e2ece6)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '13px', fontWeight: 600, color: 'var(--primary, #2b6754)' }}>
            <UserCheck size={16} /> Đăng nhập nhanh kiểm thử theo vai trò (QA Testing)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <button
              type="button"
              className="btn light"
              disabled={busy}
              onClick={() => switchPersona('lead')}
              style={{ justifyContent: 'flex-start', padding: '8px 10px', fontSize: '12px' }}
            >
              <ShieldCheck size={14} style={{ color: '#2b6754' }} />
              <span><b>Cô Mai</b> · Tổ trưởng</span>
            </button>
            <button
              type="button"
              className="btn light"
              disabled={busy}
              onClick={() => switchPersona('deputy')}
              style={{ justifyContent: 'flex-start', padding: '8px 10px', fontSize: '12px' }}
            >
              <GraduationCap size={14} style={{ color: '#c27b38' }} />
              <span><b>Thầy An</b> · Tổ phó</span>
            </button>
            <button
              type="button"
              className="btn light"
              disabled={busy}
              onClick={() => switchPersona('teacher')}
              style={{ justifyContent: 'flex-start', padding: '8px 10px', fontSize: '12px' }}
            >
              <BookOpen size={14} style={{ color: '#3d72a4' }} />
              <span><b>Cô Hương</b> · Giáo viên</span>
            </button>
            <button
              type="button"
              className="btn light"
              disabled={busy}
              onClick={() => switchPersona('bgh')}
              style={{ justifyContent: 'flex-start', padding: '8px 10px', fontSize: '12px' }}
            >
              <Eye size={14} style={{ color: '#8b4da3' }} />
              <span><b>Ban Giám Hiệu</b></span>
            </button>
          </div>
        </div>

        <form onSubmit={submit}>
          <div style={{ textAlign: 'left', marginBottom: '8px', fontSize: '12px', color: 'var(--muted, #666)' }}>
            Hoặc đăng nhập bằng tài khoản cá nhân:
          </div>
          {mode === 'signup' && (
            <label>
              Họ và tên Quý Thầy/Cô
              <input name="name" required autoComplete="name" placeholder="Ví dụ: Nguyễn Văn A" />
            </label>
          )}
          <label>
            Email công vụ / cá nhân
            <input name="email" type="email" required autoComplete="email" placeholder="thayco@edu.vn" />
          </label>
          <label>
            Mật khẩu
            <input
              name="password"
              type="password"
              required
              minLength={6}
              maxLength={128}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </label>
          <button className="btn primary" disabled={busy} type="submit" style={{ width: '100%', marginTop: '12px' }}>
            {busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            className="text-link"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setMessage('');
            }}
            style={{ marginTop: '12px', display: 'inline-block' }}
          >
            {mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </form>

        {message && (
          <p className="signin-message" role="status" style={{ marginTop: '14px', color: '#c0392b' }}>
            {message}
          </p>
        )}
        <div style={{ marginTop: '16px' }}>
          <a href="/" className="text-link">
            ← Trở về trang tổng quan
          </a>
        </div>
      </div>
    </main>
  );
}
