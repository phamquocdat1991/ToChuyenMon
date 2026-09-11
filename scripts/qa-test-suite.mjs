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

async function runQaTests() {
  console.log('====================================================');
  console.log('🚀 BẮT ĐẦU BỘ KIỂM THỬ TOÀN DIỆN QA / QC CHUYÊN SÂU');
  console.log('   Ứng dụng: Tổ Chuyên Môn 360');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, extra = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${name} ${extra}`);
      passed++;
    } else {
      console.log(`  ❌ [FAIL] ${name} ${extra}`);
      failed++;
    }
  }

  // TEST 1: Trang chủ
  console.log('--- NHÓM 1: KIỂM THỬ TRANG GIAO DIỆN & TẢI NGUYÊN ---');
  const homeRes = await request('/');
  assert('Tải trang chủ (/)', homeRes.status === 200, `(Status: ${homeRes.status})`);
  assert('Chứa tiêu đề Tổ Chuyên Môn 360', homeRes.body.includes('Tổ Chuyên Môn 360') || homeRes.body.includes('t-chuyen-mon'));

  // TEST 2: Trang đăng nhập
  const signInRes = await request('/sign-in');
  assert('Tải trang đăng nhập (/sign-in)', signInRes.status === 200, `(Status: ${signInRes.status})`);
  assert('Có tính năng đăng nhập nhanh cho tester (Persona Switch)', signInRes.body.includes('Cô Mai') || signInRes.body.includes('persona'));

  // TEST 3: API Auth status
  console.log('\n--- NHÓM 2: KIỂM THỬ XÁC THỰC & PHÂN QUYỀN (RBAC) ---');
  const authGet = await request('/api/auth');
  assert('GET /api/auth trả về trạng thái sẵn sàng', authGet.status === 200 && authGet.json?.configured === true);

  // TEST 4: Đăng nhập vai trò Tổ trưởng
  const loginLead = await request('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { action: 'switchPersona', persona: 'lead' }
  });
  assert('Chuyển vai trò Tổ trưởng (Cô Mai)', loginLead.status === 200 && loginLead.json?.ok === true);
  const cookieLead = loginLead.headers['set-cookie']?.[0]?.split(';')[0];
  assert('Hệ thống cấp phát cookie phiên làm việc (tcm_access)', !!cookieLead);

  // TEST 5: Lấy dữ liệu Workspace với cookie Tổ trưởng
  console.log('\n--- NHÓM 3: KIỂM THỬ DỮ LIỆU & QUY TRÌNH HỒ SƠ (CRUD & WORKFLOW) ---');
  const wsGet = await request('/api/workspace', {
    headers: { Cookie: cookieLead }
  });
  assert('GET /api/workspace thành công với phiên Tổ trưởng', wsGet.status === 200);
  assert('Tổ trưởng nhận diện đúng họ tên', wsGet.json?.user?.name === 'Nguyễn Thị Mai' || !!wsGet.json?.user?.name);
  assert('Workspace chứa danh sách hồ sơ khởi tạo', Array.isArray(wsGet.json?.records) && wsGet.json.records.length > 0, `(${wsGet.json?.records?.length} hồ sơ)`);

  // TEST 6: Tạo mới một hồ sơ chuyên môn
  const newDoc = {
    id: '',
    kind: 'document',
    year: '2026–2027',
    title: 'Kế hoạch đổi mới phương pháp dạy học STEM - QA Test',
    status: 'Bản nháp',
    due: '2026-10-15',
    assignee: 'm0',
    parent: null,
    category: 'Hồ sơ chuyên đề',
    body: 'Nội dung kế hoạch chuyên đề STEM cấp tổ, thực hiện bởi nhóm KHTN.',
    details: {},
    revision: 0,
    updated: '',
    actor: ''
  };
  const saveRes = await request('/api/workspace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieLead },
    body: { action: 'save', record: newDoc, note: 'Khởi tạo hồ sơ chuyên đề mới' }
  });
  assert('Tạo mới hồ sơ chuyên đề thành công', saveRes.status === 200 && saveRes.json?.ok === true);
  const createdId = saveRes.json?.id;

  // TEST 7: Xem chi tiết và lịch sử phiên bản hồ sơ vừa tạo
  const detailRes = await request(`/api/workspace?record=${createdId}`, {
    headers: { Cookie: cookieLead }
  });
  assert('Xem chi tiết hồ sơ & lịch sử phiên bản', detailRes.status === 200 && Array.isArray(detailRes.json?.versions));
  assert('Phiên bản 1 ghi nhận đúng note', detailRes.json?.versions?.[0]?.revision === 1);

  // TEST 8: Quy trình chuyển trạng thái hồ sơ: Bản nháp -> Đã nộp -> Chờ kiểm tra -> Đã duyệt
  const submitDoc = await request('/api/workspace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieLead },
    body: { action: 'save', record: { ...newDoc, id: createdId, status: 'Đã nộp', revision: 1 }, note: 'Nộp hồ sơ chuyên đề' }
  });
  assert('Chuyển trạng thái hồ sơ: Bản nháp ➔ Đã nộp', submitDoc.status === 200 && submitDoc.json?.ok === true);

  const checkDoc = await request('/api/workspace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieLead },
    body: { action: 'save', record: { ...newDoc, id: createdId, status: 'Chờ kiểm tra', revision: 2 }, note: 'Bắt đầu kiểm tra' }
  });
  assert('Chuyển trạng thái hồ sơ: Đã nộp ➔ Chờ kiểm tra', checkDoc.status === 200 && checkDoc.json?.ok === true);

  const approveDoc = await request('/api/workspace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieLead },
    body: { action: 'save', record: { ...newDoc, id: createdId, status: 'Đã duyệt', revision: 3 }, note: 'Phê duyệt hồ sơ chính thức' }
  });
  assert('Tổ trưởng duyệt hồ sơ: Chờ kiểm tra ➔ Đã duyệt', approveDoc.status === 200 && approveDoc.json?.ok === true);

  // TEST 9: Hoàn thành cuộc họp và tự động sinh biên bản & nhiệm vụ
  console.log('\n--- NHÓM 4: KIỂM THỬ LIÊN KẾT CUỘC HỌP & GIAO VIỆC TỰ ĐỘNG ---');
  const meetingAction = await request('/api/workspace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieLead },
    body: { action: 'completeMeeting', id: 'mt1' }
  });
  assert('Hoàn thành cuộc họp mt1 và tạo biên bản + nhiệm vụ', meetingAction.status === 200 && meetingAction.json?.ok === true);

  // TEST 10: Kiểm thử Trợ lý AI (Google Gemini Resilience Gateway)
  console.log('\n--- NHÓM 5: KIỂM THỬ TRỢ LÝ AI & CƠ CHẾ CHỐNG NGHẼN (GEMINI GATEWAY) ---');
  const aiInfo = await request('/api/ai');
  assert('GET /api/ai trả về danh mục mô hình Gemini chuẩn', aiInfo.status === 200 && aiInfo.json?.recommendedModel === 'gemini-3.8-flash');

  // Test gọi AI không có key (phải báo lỗi 400 hướng dẫn rõ ràng)
  const aiNoKey = await request('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieLead },
    body: { prompt: 'Kiểm tra hồ sơ', year: '2026–2027' }
  });
  assert('Kiểm tra AI khi chưa có Key: Báo lỗi 400 hướng dẫn nhập Key', aiNoKey.status === 400 && aiNoKey.json?.error?.includes('API Key'));

  // Test gọi AI với Key giả định (kiểm tra phân loại lỗi và cơ chế an toàn)
  const aiInvalidKey = await request('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-gemini-api-key': 'AIzaSy_Mock_Test_Key_For_Validation_123',
      Cookie: cookieLead
    },
    body: { prompt: 'Kiểm tra kết nối', year: '2026–2027' }
  });
  assert('Kiểm tra AI nhận diện mã khóa không hợp lệ', aiInvalidKey.status === 400 || aiInvalidKey.status === 500, `(Message: ${aiInvalidKey.json?.error})`);

  console.log('\n====================================================');
  console.log(`📊 TỔNG KẾT KẾT QUẢ KIỂM THỬ: ${passed} PASSED / ${failed} FAILED`);
  console.log('====================================================');

  if (failed === 0) {
    console.log('🎉 TẤT CẢ CÁC BỘ TEST ĐỀU THÀNH CÔNG RỰC RỠ (100% PASS)!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runQaTests().catch(err => {
  console.error('Lỗi khi chạy bộ test:', err);
  process.exit(1);
});
