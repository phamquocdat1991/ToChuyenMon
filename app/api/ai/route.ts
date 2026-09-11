import { env } from '@/lib/runtime';
import { context, fail, AppError } from '@/lib/server';
import { executeGeminiWithFallback } from '@/lib/gemini-resilience-gateway';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    serverConfigured: !!process.env.GEMINI_API_KEY,
    recommendedModel: 'gemini-3.8-flash',
    models: [
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Chính - Chuẩn sư phạm cao)' },
      { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (Dự phòng thế hệ mới)' },
      { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Dự phòng ổn định)' },
      { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite (Cứu hộ phản hồi nhanh)' },
    ]
  });
}

export async function POST(req: Request) {
  try {
    const origin = req.headers.get('origin');
    if (origin && origin !== new URL(req.url).origin) {
      throw new AppError('Yêu cầu không hợp lệ.', 403);
    }
    const c = await context();

    const clientHeaderKey = req.headers.get('x-gemini-api-key')?.trim();
    const b = (await req.json().catch(() => ({}))) as any;

    const apiKey = clientHeaderKey || b.apiKey || (env as any).GEMINI_API_KEY;
    if (!apiKey) {
      throw new AppError(
        'Chưa cấu hình Google Gemini API Key. Quý Thầy/Cô vui lòng nhập API Key trong phần Cài đặt hoặc Trợ lý AI.',
        400
      );
    }

    if (typeof b.prompt !== 'string' || !b.prompt.trim() || b.prompt.length > 5000) {
      throw new AppError('Nội dung yêu cầu cần có độ dài từ 1 đến 5.000 ký tự.');
    }

    // Lấy dữ liệu hồ sơ thực tế trong tổ để AI tổng hợp làm ngữ cảnh
    let recordsData = [];
    try {
      const records = await c.database
        .prepare('SELECT kind,title,status,due,body,assignee FROM records WHERE workspace=? AND year=? LIMIT 120')
        .bind(c.workspace.id, b.year || c.workspace.year)
        .all();
      recordsData = records.results || [];
    } catch {
      // Bỏ qua nếu chưa tải được records
    }

    const systemInstruction = `Bạn là Trợ lý AI chuyên môn cao cấp dành cho Tổ trưởng và Giáo viên Việt Nam trong hệ thống giáo dục phổ thông.
Quy chuẩn trả lời:
1. Xưng hô chuẩn mực sư phạm: "Thầy/Cô", "Quý Thầy/Cô", "Tổ chuyên môn".
2. Bám sát các quy chuẩn văn bản của Bộ GD&ĐT:
   - Đổi mới phương pháp và kế hoạch bài dạy theo Công văn 5512/BGDĐT.
   - Thẩm định Sáng kiến kinh nghiệm (SKKN) bám sát 4 tiêu chí chuẩn (100 điểm): Tính mới & Sáng tạo (30đ), Tính khoa học & Sư phạm (30đ), Tính hiệu quả & Thực nghiệm (25đ), Khả năng nhân rộng & Ứng dụng (15đ). Luôn dùng nguyên tắc phản hồi Sandwich Feedback (Khen ngợi ➔ Góp ý trọng tâm ➔ Khích lệ).
   - Tiến độ và chương trình môn học theo Chương trình GDPT 2018.
3. Chỉ dựa trên dữ liệu thực tế được cung cấp, không tự bịa số liệu thành viên hay hồ sơ.
4. Trả về kết quả mạch lạc, rõ ràng bằng tiếng Việt chuẩn, sử dụng các tiêu đề mục định dạng Markdown trực quan.
5. Luôn lưu ý: Mọi văn bản do AI soạn thảo là bản nháp gợi ý để Quý Thầy/Cô rà soát và duyệt trước khi ban hành.`;

    const fullPrompt = `${b.prompt.trim()}

---
DỮ LIỆU THAM KHẢO CỦA TỔ CHUYÊN MÔN (${c.workspace.name} · Năm học ${b.year || c.workspace.year}):
${JSON.stringify(recordsData).slice(0, 70000)}
`;

    const result = await executeGeminiWithFallback({
      apiKey,
      prompt: fullPrompt,
      systemInstruction,
      maxTokens: 3500,
    });

    return Response.json({
      text: result.text,
      modelUsed: result.modelUsed,
      durationMs: result.durationMs,
      attempts: result.attempts,
    });
  } catch (e) {
    return fail(e);
  }
}
