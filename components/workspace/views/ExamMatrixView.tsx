'use client';
import { useState } from 'react';
import { ClipboardList, Plus, Trash2, Download, Sparkles, CheckCircle2, AlertTriangle, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { SAMPLE_KHTN8_MATRIX, calculateMatrixSummary, type ExamMatrixData, type TopicMatrixRow } from '@/lib/exam-matrix';
import { generateDecree30WordHtml, downloadWordFile } from '@/lib/export-doc';

interface ExamMatrixViewProps {
  workspace: { name: string; school: string; year: string };
  user: { name: string; role: string };
  apiKey?: string;
}

export default function ExamMatrixView({ workspace, user, apiKey }: ExamMatrixViewProps) {
  const [matrix, setMatrix] = useState<ExamMatrixData>(SAMPLE_KHTN8_MATRIX);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const summary = calculateMatrixSummary(matrix);

  function handleAddRow() {
    const newRow: TopicMatrixRow = {
      id: 'row_' + Date.now(),
      topicName: `Chủ đề mới ${matrix.rows.length + 1}`,
      learningOutcomes: 'Mô tả yêu cầu cần đạt (YCCĐ) theo Chương trình GDPT 2018...',
      nhanBietTN: 2,
      thongHieuTN: 1,
      vanDungTN: 0,
      vanDungCaoTN: 0,
      nhanBietTL: 0,
      thongHieuTL: 0,
      vanDungTL: 0,
      vanDungCaoTL: 0,
      pointsPerTN: 0.25,
      pointTL: 0,
    };
    setMatrix({ ...matrix, rows: [...matrix.rows, newRow] });
    toast.success('Đã thêm mạch nội dung mới vào ma trận.');
  }

  function handleRemoveRow(id: string) {
    if (matrix.rows.length <= 1) {
      return toast.error('Ma trận cần có ít nhất một mạch nội dung.');
    }
    setMatrix({ ...matrix, rows: matrix.rows.filter(r => r.id !== id) });
    toast.info('Đã xóa mạch nội dung khỏi ma trận.');
  }

  function handleUpdateRow(id: string, updates: Partial<TopicMatrixRow>) {
    setMatrix({
      ...matrix,
      rows: matrix.rows.map(r => (r.id === id ? { ...r, ...updates } : r)),
    });
  }

  async function handleAiDraftQuestions() {
    setAiLoading(true);
    setAiGeneratedQuestions(null);

    const matrixOutline = matrix.rows.map(r => `
- ${r.topicName}:
  + YCCĐ: ${r.learningOutcomes}
  + Trắc nghiệm: NB: ${r.nhanBietTN} câu | TH: ${r.thongHieuTN} câu | VD: ${r.vanDungTN} câu | VDC: ${r.vanDungCaoTN} câu
  + Tự luận: NB: ${r.nhanBietTL} câu | TH: ${r.thongHieuTL} câu | VD: ${r.vanDungTL} câu | VDC: ${r.vanDungCaoTL} câu (Tổng ${r.pointTL}đ)
`).join('\n');

    const prompt = `Bạn là Chuyên gia Khảo thí và Đo lường Giáo dục của Bộ Giáo dục và Đào tạo Việt Nam.
Hãy xây dựng Dự thảo Bộ Câu Hỏi Đề Kiểm Tra bám sát Ma trận và Bảng đặc tả sau:

TÊN ĐỀ: ${matrix.examTitle}
MÔN: ${matrix.subject} — KHỐI: ${matrix.grade} — THỜI GIAN: ${matrix.durationMinutes} PHÚT
TỔNG SỐ CÂU: ${summary.totalTNCount} câu TNKQ + ${summary.totalTLCount} câu Tự luận. Tổng điểm: 10.0 điểm.

MA TRẬN NỘI DUNG:
${matrixOutline}

YÊU CẦU ĐẦU RA:
1. PHẦN I: TRẮC NGHIỆM KHÁCH QUAN (${summary.totalTNCount} câu, mỗi câu 0.25 điểm).
   - Đánh số rõ ràng: Câu 1, Câu 2...
   - 4 đáp án A, B, C, D (ghi rõ đáp án đúng và mức độ: [Nhận biết], [Thông hiểu], [Vận dụng]).
2. PHẦN II: TỰ LUẬN (${summary.totalTLCount} câu, tổng ${matrix.rows.reduce((acc, r) => acc + r.pointTL, 0)} điểm).
   - Đánh số: Câu 1 (tự luận)... ghi kèm số điểm từng ý và thang điểm / hướng dẫn chấm chi tiết.
3. Sử dụng ký hiệu công thức khoa học (nếu có Toán/Lý/Hóa thì viết rõ công thức).
4. Câu từ chuẩn mực sư phạm, phù hợp lứa tuổi học sinh lớp ${matrix.grade}.`;

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

      setAiGeneratedQuestions(data.text);
      toast.success(`AI đã soạn thảo xong bộ câu hỏi theo ma trận (${data.modelUsed || 'Gemini'})!`);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tạo câu hỏi.');
    } finally {
      setAiLoading(false);
    }
  }

  function handleExportWord() {
    const tableHeaders = [
      'STT',
      'Chủ đề / Mạch nội dung',
      'Yêu cầu cần đạt (YCCĐ)',
      'Nhận biết (TNKQ/TL)',
      'Thông hiểu (TNKQ/TL)',
      'Vận dụng (TNKQ/TL)',
      'Vận dụng cao (TNKQ/TL)',
      'Tổng điểm',
    ];

    const tableRows = matrix.rows.map((r, i) => {
      const subTotal = (r.nhanBietTN + r.thongHieuTN + r.vanDungTN + r.vanDungCaoTN) * (r.pointsPerTN || 0.25) + (r.pointTL || 0);
      return [
        String(i + 1),
        r.topicName,
        r.learningOutcomes,
        `${r.nhanBietTN} TN / ${r.nhanBietTL} TL`,
        `${r.thongHieuTN} TN / ${r.thongHieuTL} TL`,
        `${r.vanDungTN} TN / ${r.vanDungTL} TL`,
        `${r.vanDungCaoTN} TN / ${r.vanDungCaoTL} TL`,
        `${subTotal.toFixed(2)} đ`,
      ];
    });

    // Thêm hàng tổng kết
    tableRows.push([
      '',
      'TỔNG HỢP TOÀN ĐỀ',
      `TNKQ: ${summary.totalTNCount} câu | Tự luận: ${summary.totalTLCount} câu`,
      `${summary.nhanBietScore}đ (${summary.nhanBietPct}%)`,
      `${summary.thongHieuScore}đ (${summary.thongHieuPct}%)`,
      `${summary.vanDungScore}đ (${summary.vanDungPct}%)`,
      `${summary.vanDungCaoScore}đ (${summary.vanDungCaoPct}%)`,
      `${summary.totalScore.toFixed(2)} đ (100%)`,
    ]);

    const html = generateDecree30WordHtml({
      title: 'MA TRẬN VÀ BẢNG ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KỲ',
      documentNumber: 'Số: …/MT-BĐTK',
      schoolName: workspace.school,
      departmentName: workspace.name,
      metaSummary: `${matrix.examTitle} — Môn: ${matrix.subject} — Khối: ${matrix.grade} (Thời gian làm bài: ${matrix.durationMinutes} phút)`,
      signerTitle: 'TỔ TRƯỞNG CHUYÊN MÔN',
      signerName: user.name,
      secretaryTitle: 'GIÁO VIÊN RA ĐỀ',
      secretaryName: 'Nguyễn Văn An',
      sections: [
        {
          heading: 'I. KHUNG MA TRẬN ĐỀ KIỂM TRA (THÔNG TƯ 22/2021/TT-BGDĐT)',
          content: [
            `Hình thức kiểm tra: Kết hợp Trắc nghiệm khách quan (${matrix.mcqRatio}%) và Tự luận (${matrix.essayRatio}%).`,
            `Tỷ lệ mức độ nhận thức: Nhận biết ${summary.nhanBietPct}% — Thông hiểu ${summary.thongHieuPct}% — Vận dụng ${summary.vanDungPct}% — Vận dụng cao ${summary.vanDungCaoPct}%.`,
            `Tổng số câu hỏi: ${summary.totalQuestions} câu. Tổng điểm bài thi: ${summary.totalScore} điểm.`,
          ],
          table: {
            headers: tableHeaders,
            rows: tableRows,
          },
        },
        {
          heading: 'II. BẢN ĐẶC TẢ CHI TIẾT CÁC CÂU HỎI & HƯỚNG DẪN CHẤM',
          content: aiGeneratedQuestions
            ? `Dự thảo câu hỏi và đáp án do Tổ chuyên môn xây dựng:\n\n${aiGeneratedQuestions}`
            : 'Đề kiểm tra và đáp án chi tiết được duyệt kèm theo biên bản này.',
        },
      ],
      notes: [
        'Ban Giám hiệu (để phê duyệt);',
        'Bộ phận Khảo thí & In sao đề;',
      ],
    });

    downloadWordFile(`Ma-tran-de-${matrix.subject.replace(/\s+/g, '_')}-K${matrix.grade}.doc`, html);
    toast.success('Đã xuất Ma trận & Bảng đặc tả chuẩn Nghị định 30!');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <section className="panel" style={{ background: 'linear-gradient(135deg, #fbfbf9 0%, #eef5fb 100%)', border: '1px solid #d4e3f1', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1a5f7a', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
              <ClipboardList size={18} /> KHẢO THÍ & ĐO LƯỜNG SƯ PHẠM
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#10394a' }}>Ma Trận & Bảng Đặc Tả Đề Kiểm Tra (Thông tư 22)</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#56717d' }}>
              Chuẩn hóa 4 mức độ nhận thức (Nhận biết 40% - Thông hiểu 30% - Vận dụng 20% - Vận dụng cao 10%), tự động cân bằng thang điểm 10.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn light"
              onClick={handleExportWord}
            >
              <Download size={16} /> Xuất Word Ma Trận (NĐ 30)
            </button>
            <button
              type="button"
              className="btn primary"
              disabled={aiLoading}
              onClick={handleAiDraftQuestions}
            >
              {aiLoading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {aiLoading ? 'AI đang tạo câu hỏi…' : 'AI Soạn câu hỏi theo ma trận'}
            </button>
          </div>
        </div>
      </section>

      {/* Meta Config Bar */}
      <div className="panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', padding: '14px 18px' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600, minWidth: '220px', flex: 1 }}>
          Tên bài kiểm tra
          <input
            value={matrix.examTitle}
            onChange={e => setMatrix({ ...matrix, examTitle: e.target.value })}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600, width: '130px' }}>
          Môn học
          <input
            value={matrix.subject}
            onChange={e => setMatrix({ ...matrix, subject: e.target.value })}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600, width: '80px' }}>
          Khối lớp
          <input
            value={matrix.grade}
            onChange={e => setMatrix({ ...matrix, grade: e.target.value })}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600, width: '100px' }}>
          Thời gian (phút)
          <input
            type="number"
            value={matrix.durationMinutes}
            onChange={e => setMatrix({ ...matrix, durationMinutes: Number(e.target.value) })}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
          />
        </label>
      </div>

      {/* 4 Cognitive Levels Summary KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <div className="panel" style={{ borderLeft: '4px solid #3d72a4', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: '#555', fontWeight: 600 }}>1. NHẬN BIẾT</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
            <strong style={{ fontSize: '20px', color: '#3d72a4' }}>{summary.nhanBietScore}đ</strong>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#666' }}>({summary.nhanBietPct}%)</span>
          </div>
          <small style={{ color: '#888', fontSize: '11px' }}>Chuẩn Bộ: ~40% (4.0đ)</small>
        </div>

        <div className="panel" style={{ borderLeft: '4px solid #2b6754', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: '#555', fontWeight: 600 }}>2. THÔNG HIỂU</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
            <strong style={{ fontSize: '20px', color: '#2b6754' }}>{summary.thongHieuScore}đ</strong>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#666' }}>({summary.thongHieuPct}%)</span>
          </div>
          <small style={{ color: '#888', fontSize: '11px' }}>Chuẩn Bộ: ~30% (3.0đ)</small>
        </div>

        <div className="panel" style={{ borderLeft: '4px solid #d97706', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: '#555', fontWeight: 600 }}>3. VẬN DỤNG</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
            <strong style={{ fontSize: '20px', color: '#d97706' }}>{summary.vanDungScore}đ</strong>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#666' }}>({summary.vanDungPct}%)</span>
          </div>
          <small style={{ color: '#888', fontSize: '11px' }}>Chuẩn Bộ: ~20% (2.0đ)</small>
        </div>

        <div className="panel" style={{ borderLeft: '4px solid #c0392b', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: '#555', fontWeight: 600 }}>4. VẬN DỤNG CAO</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
            <strong style={{ fontSize: '20px', color: '#c0392b' }}>{summary.vanDungCaoScore}đ</strong>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#666' }}>({summary.vanDungCaoPct}%)</span>
          </div>
          <small style={{ color: '#888', fontSize: '11px' }}>Chuẩn Bộ: ~10% (1.0đ)</small>
        </div>

        <div className="panel" style={{ borderLeft: `4px solid ${summary.isStandardValid ? '#2b6754' : '#c0392b'}`, padding: '14px' }}>
          <div style={{ fontSize: '12px', color: '#555', fontWeight: 600 }}>TỔNG ĐIỂM TOÀN ĐỀ</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
            <strong style={{ fontSize: '20px', color: summary.isStandardValid ? '#2b6754' : '#c0392b' }}>
              {summary.totalScore}/10.0
            </strong>
          </div>
          <small style={{ color: summary.isStandardValid ? '#2b6754' : '#c0392b', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {summary.isStandardValid ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
            {summary.isStandardValid ? 'Đạt chuẩn 10.0đ' : 'Cần cân bằng lại'}
          </small>
        </div>
      </div>

      {/* Main Matrix Editor Table */}
      <section className="panel" style={{ overflowX: 'auto', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Khung Ma Trận & Bảng Đặc Tả Chi Tiết</h3>
          <button type="button" className="btn light" onClick={handleAddRow} style={{ fontSize: '13px' }}>
            <Plus size={15} /> Thêm chủ đề / mạch nội dung
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--panel-alt, #f7f9f8)', borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', width: '22%' }}>Chủ đề / YCCĐ</th>
              <th style={{ padding: '8px 6px', textAlign: 'center', width: '14%', color: '#3d72a4' }}>Nhận biết<br/><small style={{ fontWeight: 'normal' }}>(TN / TL)</small></th>
              <th style={{ padding: '8px 6px', textAlign: 'center', width: '14%', color: '#2b6754' }}>Thông hiểu<br/><small style={{ fontWeight: 'normal' }}>(TN / TL)</small></th>
              <th style={{ padding: '8px 6px', textAlign: 'center', width: '14%', color: '#d97706' }}>Vận dụng<br/><small style={{ fontWeight: 'normal' }}>(TN / TL)</small></th>
              <th style={{ padding: '8px 6px', textAlign: 'center', width: '14%', color: '#c0392b' }}>Vận dụng cao<br/><small style={{ fontWeight: 'normal' }}>(TN / TL)</small></th>
              <th style={{ padding: '8px 6px', textAlign: 'center', width: '12%' }}>Điểm TL (đ)</th>
              <th style={{ padding: '8px 6px', textAlign: 'center', width: '10%' }}>Tổng điểm</th>
              <th style={{ padding: '8px 6px', textAlign: 'center', width: '4%' }}></th>
            </tr>
          </thead>
          <tbody>
            {matrix.rows.map((r, idx) => {
              const subScore = (r.nhanBietTN + r.thongHieuTN + r.vanDungTN + r.vanDungCaoTN) * (r.pointsPerTN || 0.25) + (r.pointTL || 0);
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                    <input
                      value={r.topicName}
                      onChange={e => handleUpdateRow(r.id, { topicName: e.target.value })}
                      style={{ width: '100%', fontWeight: 600, padding: '4px 6px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '6px' }}
                    />
                    <textarea
                      rows={2}
                      value={r.learningOutcomes}
                      onChange={e => handleUpdateRow(r.id, { learningOutcomes: e.target.value })}
                      placeholder="Yêu cầu cần đạt..."
                      style={{ width: '100%', fontSize: '11px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #eee', resize: 'vertical' }}
                    />
                  </td>

                  {/* Nhận biết */}
                  <td style={{ padding: '8px 6px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        title="Số câu trắc nghiệm nhận biết"
                        value={r.nhanBietTN}
                        onChange={e => handleUpdateRow(r.id, { nhanBietTN: Number(e.target.value) })}
                        style={{ width: '40px', textAlign: 'center', padding: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                      <input
                        type="number"
                        min="0"
                        title="Số câu tự luận nhận biết"
                        value={r.nhanBietTL}
                        onChange={e => handleUpdateRow(r.id, { nhanBietTL: Number(e.target.value) })}
                        style={{ width: '40px', textAlign: 'center', padding: '4px', borderRadius: '4px', border: '1px solid #ddd', background: '#f9f9f9' }}
                      />
                    </div>
                  </td>

                  {/* Thông hiểu */}
                  <td style={{ padding: '8px 6px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        title="Số câu trắc nghiệm thông hiểu"
                        value={r.thongHieuTN}
                        onChange={e => handleUpdateRow(r.id, { thongHieuTN: Number(e.target.value) })}
                        style={{ width: '40px', textAlign: 'center', padding: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                      <input
                        type="number"
                        min="0"
                        title="Số câu tự luận thông hiểu"
                        value={r.thongHieuTL}
                        onChange={e => handleUpdateRow(r.id, { thongHieuTL: Number(e.target.value) })}
                        style={{ width: '40px', textAlign: 'center', padding: '4px', borderRadius: '4px', border: '1px solid #ddd', background: '#f9f9f9' }}
                      />
                    </div>
                  </td>

                  {/* Vận dụng */}
                  <td style={{ padding: '8px 6px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        title="Số câu trắc nghiệm vận dụng"
                        value={r.vanDungTN}
                        onChange={e => handleUpdateRow(r.id, { vanDungTN: Number(e.target.value) })}
                        style={{ width: '40px', textAlign: 'center', padding: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                      <input
                        type="number"
                        min="0"
                        title="Số câu tự luận vận dụng"
                        value={r.vanDungTL}
                        onChange={e => handleUpdateRow(r.id, { vanDungTL: Number(e.target.value) })}
                        style={{ width: '40px', textAlign: 'center', padding: '4px', borderRadius: '4px', border: '1px solid #ddd', background: '#f9f9f9' }}
                      />
                    </div>
                  </td>

                  {/* Vận dụng cao */}
                  <td style={{ padding: '8px 6px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        title="Số câu trắc nghiệm vận dụng cao"
                        value={r.vanDungCaoTN}
                        onChange={e => handleUpdateRow(r.id, { vanDungCaoTN: Number(e.target.value) })}
                        style={{ width: '40px', textAlign: 'center', padding: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                      <input
                        type="number"
                        min="0"
                        title="Số câu tự luận vận dụng cao"
                        value={r.vanDungCaoTL}
                        onChange={e => handleUpdateRow(r.id, { vanDungCaoTL: Number(e.target.value) })}
                        style={{ width: '40px', textAlign: 'center', padding: '4px', borderRadius: '4px', border: '1px solid #ddd', background: '#f9f9f9' }}
                      />
                    </div>
                  </td>

                  {/* Điểm TL */}
                  <td style={{ padding: '8px 6px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={r.pointTL}
                      onChange={e => handleUpdateRow(r.id, { pointTL: Number(e.target.value) })}
                      style={{ width: '60px', textAlign: 'center', padding: '4px', borderRadius: '4px', border: '1px solid #ddd', fontWeight: 600 }}
                    />
                  </td>

                  {/* Tổng điểm chủ đề */}
                  <td style={{ padding: '8px 6px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 700, color: '#2b6754' }}>
                    {subScore.toFixed(2)}đ
                  </td>

                  {/* Xóa dòng */}
                  <td style={{ padding: '8px 6px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <button
                      type="button"
                      aria-label="Xóa chủ đề"
                      onClick={() => handleRemoveRow(r.id)}
                      style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', opacity: 0.7 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* AI Generated Questions Panel */}
      {aiGeneratedQuestions && (
        <section className="panel" style={{ border: '1px solid #cfe2f3', background: '#fbfdff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1a5f7a' }}>
              <Sparkles size={18} />
              <h3 style={{ margin: 0, fontSize: '16px' }}>Đề Kiểm Tra Dự Thảo Theo Ma Trận (Trắc Nghiệm & Tự Luận)</h3>
            </div>
            <button
              type="button"
              className="btn light"
              style={{ fontSize: '12px', padding: '4px 10px' }}
              onClick={() => {
                navigator.clipboard.writeText(aiGeneratedQuestions);
                toast.success('Đã sao chép nội dung câu hỏi!');
              }}
            >
              Sao chép đề kiểm tra
            </button>
          </div>

          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.65', fontSize: '13.5px', color: '#2c3e50', background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e1eaf1' }}>
            {aiGeneratedQuestions}
          </div>
        </section>
      )}
    </div>
  );
}
