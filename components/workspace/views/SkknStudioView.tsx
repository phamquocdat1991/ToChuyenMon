'use client';
import { useState } from 'react';
import { Sparkles, Award, FileText, Download, CheckCircle2, AlertCircle, RefreshCw, Send, BookOpen, User, Scale } from 'lucide-react';
import { toast } from 'sonner';
import { SKKN_RUBRICS, SAMPLE_SKKN_FIXTURES, classifySkknScore, type SkknEvaluationScore } from '@/lib/skkn-evaluator';
import { generateDecree30WordHtml, downloadWordFile } from '@/lib/export-doc';

interface SkknStudioViewProps {
  workspace: { name: string; school: string; year: string };
  user: { name: string; role: string };
  apiKey?: string;
}

export default function SkknStudioView({ workspace, user, apiKey }: SkknStudioViewProps) {
  const [topicTitle, setTopicTitle] = useState(SAMPLE_SKKN_FIXTURES[0].title);
  const [authorName, setAuthorName] = useState(SAMPLE_SKKN_FIXTURES[0].author);
  const [subject, setSubject] = useState(SAMPLE_SKKN_FIXTURES[0].subject);
  const [grade, setGrade] = useState(SAMPLE_SKKN_FIXTURES[0].grade);
  const [contentSummary, setContentSummary] = useState(SAMPLE_SKKN_FIXTURES[0].summary);

  const [scores, setScores] = useState<SkknEvaluationScore>({
    novelty: 28,
    scientific: 28,
    effectiveness: 24,
    applicability: 13,
  });

  const [evaluatorNotes, setEvaluatorNotes] = useState('');
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const totalScore = scores.novelty + scores.scientific + scores.effectiveness + scores.applicability;
  const classification = classifySkknScore(totalScore);

  function loadFixture(id: string) {
    const f = SAMPLE_SKKN_FIXTURES.find(x => x.id === id);
    if (!f) return;
    setTopicTitle(f.title);
    setAuthorName(f.author);
    setSubject(f.subject);
    setGrade(f.grade);
    setContentSummary(f.summary);
    setAiFeedback(null);

    if (id === 'sample_1') {
      setScores({ novelty: 28, scientific: 28, effectiveness: 24, applicability: 13 });
    } else if (id === 'sample_2') {
      setScores({ novelty: 22, scientific: 23, effectiveness: 19, applicability: 12 });
    } else {
      setScores({ novelty: 14, scientific: 15, effectiveness: 11, applicability: 7 });
    }
    toast.success(`Đã tải mẫu kiểm thử: ${f.title.slice(0, 45)}…`);
  }

  async function handleAiEvaluate() {
    if (!contentSummary.trim()) {
      return toast.error('Vui lòng nhập tóm tắt nội dung đề tài SKKN trước khi yêu cầu AI.');
    }

    setAiLoading(true);
    setAiFeedback(null);

    const prompt = `Yêu cầu thẩm định chi tiết đề tài Sáng kiến kinh nghiệm (SKKN) sư phạm:
TÊN ĐỀ TÀI: "${topicTitle}"
TÁC GIẢ: ${authorName} (Môn: ${subject}, Khối: ${grade})

NỘI DUNG TÓM TẮT & MINH CHỨNG:
${contentSummary}

Hãy phân tích và thẩm định theo Barem 100 điểm chuẩn của Bộ GD&ĐT:
1. Phân tích 4 thành tố bắt buộc: Biện pháp, Đối tượng, Phạm vi, Mục tiêu đã đạt chuẩn chưa?
2. Chấm điểm từng tiêu chí (kèm giải thích ngắn gọn):
   - Tính mới & Sáng tạo (tối đa 30đ):
   - Tính khoa học & Sư phạm (tối đa 30đ):
   - Tính hiệu quả & Thực nghiệm (tối đa 25đ):
   - Khả năng nhân rộng (tối đa 15đ):
   => TỔNG ĐIỂM DỰ KIẾN (trên 100) và XẾP LOẠI.
3. Nhận xét theo nguyên tắc Bánh Kẹp (Sandwich Feedback):
   - Lớp 1 (Khen ngợi & Điểm sáng): Tôn vinh nỗ lực và tính thực tiễn.
   - Lớp 2 (Góp ý trọng tâm): Chỉ rõ điểm còn yếu (số liệu đối chứng, tính khả thi) và ĐOẠN VĂN GỢI Ý VIẾT LẠI MẪU để nâng tầm đề tài.
   - Lớp 3 (Khích lệ & Triển vọng): Động viên Thầy/Cô tiếp tục phát triển đề tài dự thi cấp trên.`;

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-api-key': apiKey.trim() } : {}),
        },
        body: JSON.stringify({
          prompt,
          year: workspace.year,
          apiKey: apiKey?.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi gọi AI');

      setAiFeedback(data.text);
      toast.success(`AI đã thẩm định xong bằng mô hình ${data.modelUsed || 'Gemini'} (${data.durationMs}ms)`);
    } catch (err: any) {
      toast.error(err.message || 'Không thể kết nối đến Trợ lý AI.');
    } finally {
      setAiLoading(false);
    }
  }

  function handleExportWord() {
    const html = generateDecree30WordHtml({
      title: 'PHIẾU ĐÁNH GIÁ, THẨM ĐỊNH SÁNG KIẾN KINH NGHIỆM',
      documentNumber: 'Số: …/PĐG-SKKN',
      schoolName: workspace.school,
      departmentName: workspace.name,
      metaSummary: `Năm học: ${workspace.year} — Barem 100 điểm Bộ Giáo dục và Đào tạo`,
      signerTitle: 'TỔ TRƯỞNG CHUYÊN MÔN / GIÁM KHẢO',
      signerName: user.name,
      secretaryTitle: 'THƯ KÝ TỔ',
      secretaryName: 'Trần Thị Hương',
      sections: [
        {
          heading: 'I. THÔNG TIN CHUNG VỀ SÁNG KIẾN',
          content: [
            `Tên đề tài: ${topicTitle}`,
            `Tác giả sáng kiến: ${authorName}`,
            `Môn giảng dạy: ${subject} — Khối lớp: ${grade}`,
            `Đơn vị công tác: ${workspace.name}, ${workspace.school}`,
          ],
        },
        {
          heading: 'II. KẾT QUẢ ĐÁNH GIÁ THEO TIÊU CHÍ (BAREM 100 ĐIỂM)',
          content: `Tổng điểm đánh giá: ${totalScore}/100 điểm. Xếp loại đề tài: ${classification.grade}.`,
          table: {
            headers: ['STT', 'Tiêu chuẩn thẩm định', 'Điểm tối đa', 'Điểm đạt được', 'Ghi chú'],
            rows: [
              ['1', 'Tính mới & Sáng tạo', '30 điểm', `${scores.novelty} điểm`, 'Giải pháp cải tiến, ứng dụng CNTT/AI'],
              ['2', 'Tính khoa học & Sư phạm', '30 điểm', `${scores.scientific} điểm`, 'Lập luận logic, đúng CT GDPT 2018'],
              ['3', 'Tính hiệu quả & Thực nghiệm', '25 điểm', `${scores.effectiveness} điểm`, 'Số liệu đối chứng trước và sau tác động'],
              ['4', 'Khả năng nhân rộng & Ứng dụng', '15 điểm', `${scores.applicability} điểm`, 'Khả năng chuyển giao cho đồng nghiệp'],
              ['', 'TỔNG CỘNG', '100 điểm', `${totalScore} điểm`, classification.grade],
            ],
          },
        },
        {
          heading: 'III. NHẬN XÉT, ĐÁNH GIÁ CỦA GIÁM KHẢO (SANDWICH FEEDBACK)',
          content: [
            aiFeedback ? `Ý kiến thẩm định từ Trợ lý Sư phạm AI:\n${aiFeedback}` : 'Đề tài có sự đầu tư tâm huyết, cấu trúc mạch lạc.',
            evaluatorNotes ? `Ghi chú riêng của Tổ trưởng: ${evaluatorNotes}` : 'Đạt chuẩn lưu hồ sơ tổ và đề xuất dự thi cấp trên.',
            `Kiến nghị của Hội đồng/Tổ chuyên môn: ${classification.recommendation}`,
          ],
        },
      ],
      notes: [
        'Hội đồng Khoa học nhà trường (để xét duyệt);',
        'Tác giả đề tài (để hoàn thiện);',
      ],
    });

    downloadWordFile(`Phieu-tham-dinh-SKKN-${authorName.replace(/\s+/g, '_')}.doc`, html);
    toast.success('Đã xuất Phiếu thẩm định SKKN chuẩn Nghị định 30 (.doc)!');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <section className="panel" style={{ background: 'linear-gradient(135deg, #fdfbf7 0%, #edf7f2 100%)', border: '1px solid #dbece2', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2b6754', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
              <Award size={18} /> STUDIO THẨM ĐỊNH SÁNG KIẾN KINH NGHIỆM (SKKN)
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#1a382e' }}>Barem Chuẩn 100 Điểm & Phản Hồi Sandwich</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#5b6b64' }}>
              Thẩm định đề tài giáo viên, tính điểm tự động theo 4 tiêu chí của Bộ GD&ĐT, kết hợp AI phân tích cấu trúc 4 thành tố.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#666', alignSelf: 'center' }}>Thử nghiệm nhanh:</span>
            {SAMPLE_SKKN_FIXTURES.map((f, i) => (
              <button
                key={f.id}
                type="button"
                className="btn light"
                style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={() => loadFixture(f.id)}
              >
                Mẫu {i + 1} ({f.expectedScore}đ)
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Split Studio Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Left Column: SKKN Document Inputs */}
        <section className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            <FileText size={18} style={{ color: '#2b6754' }} />
            <h3 style={{ margin: 0, fontSize: '16px' }}>Thông Tin & Tóm Tắt Đề Tài</h3>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', fontWeight: 500 }}>
            Tên đề tài Sáng kiến kinh nghiệm <em>*</em>
            <input
              value={topicTitle}
              onChange={e => setTopicTitle(e.target.value)}
              placeholder="Nhập tên đề tài sáng kiến..."
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', fontWeight: 500 }}>
              Tác giả
              <input
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                placeholder="Họ và tên GV"
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', fontWeight: 500 }}>
              Môn học
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Môn dạy"
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', fontWeight: 500 }}>
              Khối lớp
              <input
                value={grade}
                onChange={e => setGrade(e.target.value)}
                placeholder="Khối"
                style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}
              />
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', fontWeight: 500 }}>
            Tóm tắt nội dung, tính mới và số liệu thực nghiệm
            <textarea
              rows={9}
              value={contentSummary}
              onChange={e => setContentSummary(e.target.value)}
              placeholder="Dán tóm tắt nội dung SKKN, các biện pháp thực hiện và số liệu đối chứng tại đây..."
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', lineHeight: '1.5', fontFamily: 'inherit' }}
            />
          </label>

          <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
            <button
              type="button"
              className="btn primary"
              disabled={aiLoading}
              onClick={handleAiEvaluate}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {aiLoading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {aiLoading ? 'AI đang thẩm định…' : 'AI Thẩm định chuyên sâu (Gemini)'}
            </button>
          </div>
        </section>

        {/* Right Column: Interactive Rubric Scoring */}
        <section className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scale size={18} style={{ color: '#2b6754' }} />
              <h3 style={{ margin: 0, fontSize: '16px' }}>Phiếu Chấm Điểm (Barem 100đ)</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: '#666' }}>Tổng:</span>
              <strong style={{ fontSize: '20px', color: classification.badgeColor }}>{totalScore}/100</strong>
            </div>
          </div>

          {/* Classification Banner */}
          <div style={{
            background: `${classification.badgeColor}15`,
            borderLeft: `4px solid ${classification.badgeColor}`,
            padding: '10px 14px',
            borderRadius: '0 8px 8px 0',
          }}>
            <div style={{ fontWeight: 700, color: classification.badgeColor, fontSize: '14px' }}>
              {classification.grade}
            </div>
            <div style={{ fontSize: '12px', color: '#444', marginTop: '2px' }}>
              {classification.recommendation}
            </div>
          </div>

          {/* 4 Rubric Criteria Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 1. Novelty (30) */}
            <div style={{ background: 'var(--panel-alt, #fcfaf8)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>1. Tính mới & Sáng tạo</span>
                <span style={{ fontWeight: 700, color: '#2b6754' }}>{scores.novelty} / 30 đ</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={scores.novelty}
                onChange={e => setScores({ ...scores, novelty: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#2b6754' }}
              />
              <div style={{ fontSize: '11px', color: '#777', marginTop: '4px' }}>
                Giải pháp không trùng lặp, có cải tiến phương pháp, ứng dụng CNTT hoặc AI.
              </div>
            </div>

            {/* 2. Scientific & Pedagogical (30) */}
            <div style={{ background: 'var(--panel-alt, #fcfaf8)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>2. Tính khoa học & Sư phạm</span>
                <span style={{ fontWeight: 700, color: '#2b6754' }}>{scores.scientific} / 30 đ</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={scores.scientific}
                onChange={e => setScores({ ...scores, scientific: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#2b6754' }}
              />
              <div style={{ fontSize: '11px', color: '#777', marginTop: '4px' }}>
                Lập luận logic, cơ sở lý luận vững, đúng chuẩn CT GDPT 2018.
              </div>
            </div>

            {/* 3. Effectiveness (25) */}
            <div style={{ background: 'var(--panel-alt, #fcfaf8)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>3. Tính hiệu quả & Thực nghiệm</span>
                <span style={{ fontWeight: 700, color: '#2b6754' }}>{scores.effectiveness} / 25 đ</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                value={scores.effectiveness}
                onChange={e => setScores({ ...scores, effectiveness: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#2b6754' }}
              />
              <div style={{ fontSize: '11px', color: '#777', marginTop: '4px' }}>
                Có bảng số liệu đối chứng trước và sau khi thực nghiệm sư phạm.
              </div>
            </div>

            {/* 4. Applicability (15) */}
            <div style={{ background: 'var(--panel-alt, #fcfaf8)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>4. Khả năng nhân rộng & Ứng dụng</span>
                <span style={{ fontWeight: 700, color: '#2b6754' }}>{scores.applicability} / 15 đ</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={scores.applicability}
                onChange={e => setScores({ ...scores, applicability: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#2b6754' }}
              />
              <div style={{ fontSize: '11px', color: '#777', marginTop: '4px' }}>
                Dễ chuyển giao, phù hợp điều kiện thực tế đa số trường học.
              </div>
            </div>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', fontWeight: 500 }}>
            Ghi chú / Nhận xét của Tổ trưởng:
            <input
              value={evaluatorNotes}
              onChange={e => setEvaluatorNotes(e.target.value)}
              placeholder="Ghi nhận xét tóm tắt của người chấm..."
              style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}
            />
          </label>

          <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
            <button
              type="button"
              className="btn light"
              onClick={handleExportWord}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <Download size={16} /> Xuất Phiếu Thẩm Định (Nghị định 30)
            </button>
          </div>
        </section>
      </div>

      {/* AI Sandwich Feedback Display Panel */}
      {aiFeedback && (
        <section className="panel" style={{ border: '1px solid #c7e5d8', background: '#fafdfb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2b6754' }}>
              <Sparkles size={18} />
              <h3 style={{ margin: 0, fontSize: '16px' }}>Phân Tích Sư Phạm & Nhận Xét Sandwich Feedback từ AI</h3>
            </div>
            <button
              type="button"
              className="btn light"
              style={{ fontSize: '12px', padding: '4px 10px' }}
              onClick={() => {
                navigator.clipboard.writeText(aiFeedback);
                toast.success('Đã sao chép nhận xét AI!');
              }}
            >
              Sao chép nhận xét
            </button>
          </div>

          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.65', fontSize: '13.5px', color: '#2c3e50', background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e1eee7' }}>
            {aiFeedback}
          </div>
        </section>
      )}
    </div>
  );
}
