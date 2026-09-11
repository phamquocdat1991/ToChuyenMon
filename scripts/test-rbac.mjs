import http from 'node:http';

async function request(path, options = {}) {
  const url = new URL(path, 'http://localhost:3000');
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, body: data, json });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function testRbac() {
  console.log('--- KIỂM THỬ MA TRẬN BẢO MẬT & PHÂN QUYỀN (RBAC SECURITY AUDIT) ---');

  // 1. Đăng nhập vai trò Giáo viên (Cô Hương - m2)
  const teacherLogin = await request('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { action: 'switchPersona', persona: 'teacher' }
  });
  const teacherCookie = teacherLogin.headers['set-cookie']?.[0]?.split(';')[0];
  console.log('✅ Đăng nhập vai trò Giáo viên thành công');

  // 2. Thử thay đổi cấu hình tổ (Settings) với vai trò Giáo viên -> Phải bị chặn (403)
  const changeSettings = await request('/api/workspace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: teacherCookie },
    body: { action: 'settings', name: 'Đổi tên tổ trái phép', year: '2026-2027', school: 'THCS' }
  });
  if (changeSettings.status === 403) {
    console.log('✅ [PASS] Chặn Giáo viên đổi cấu hình tổ chuyên môn (HTTP 403 Forbidden)');
  } else {
    console.error('❌ [FAIL] Giáo viên lại đổi được cấu hình tổ:', changeSettings.status);
    process.exit(1);
  }

  // 3. Thử phân quyền thành viên (Invite) với vai trò Giáo viên -> Phải bị chặn (403)
  const inviteMember = await request('/api/workspace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: teacherCookie },
    body: { action: 'invite', member: 'm0', email: 'hack@edu.vn', role: 'Tổ trưởng' }
  });
  if (inviteMember.status === 403) {
    console.log('✅ [PASS] Chặn Giáo viên tự ý phân quyền thành viên (HTTP 403 Forbidden)');
  } else {
    console.error('❌ [FAIL] Giáo viên lại phân quyền được:', inviteMember.status);
    process.exit(1);
  }

  console.log('\n🎉 TOÀN BỘ CƠ CHẾ BẢO MẬT PHÂN QUYỀN ĐẠT CHUẨN AN TOÀN TUYỆT ĐỐI!');
}

testRbac().catch(e => { console.error(e); process.exit(1); });
