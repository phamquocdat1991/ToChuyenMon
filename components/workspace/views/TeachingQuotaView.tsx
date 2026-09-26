'use client';
import { useState } from 'react';
import { Scale, Users, Download, AlertTriangle, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import { toast } from 'sonner';
import { SCHOOL_LEVEL_NORMS, DUTY_REDUCTIONS, calculateTeacherWorkload } from '@/lib/teaching-quota';
import { generateDecree30WordHtml, downloadWordFile } from '@/lib/export-doc';

interface TeachingQuotaViewProps {
  workspace: { name: string; school: string; year: string };
  user: { name: string; role: string };
  members: any[];
  assignments: any[];
}

interface TeacherWorkloadState {
  memberId: string;
  name: string;
  subject: string;
  classes: string;
  assignedPeriods: number;
  duties: string[];
}

export default function TeachingQuotaView({ workspace, user, members, assignments }: TeachingQuotaViewProps) {
  const [levelKey, setLevelKey] = useState<'thcs' | 'thpt' | 'tieuhoc'>('thcs');

  // Khởi tạo danh sách giáo viên kèm tiết dạy và kiêm nhiệm
  const [teachers, setTeachers] = useState<TeacherWorkloadState[]>(() => {
    return members.map((m, i) => {
      const defaultDuties: string[] = [];
      if (i === 0) defaultDuties.push('to_truong');
      if (i === 1) defaultDuties.push('to_pho');
      if (i === 2 || i === 4) defaultDuties.push('chu_nhiem');
      if (i === 3) defaultDuties.push('thiet_bi');

      // Tính tổng số tiết từ assignments
      const myAs = assignments.filter(a => a.assignee === m.id);
      const totalP = myAs.reduce((sum, a) => sum + (Number(a.details?.periods) || 0), 0);
      const assignedPeriods = totalP > 0 ? totalP : (i % 2 === 0 ? 16 : 19);

      return {
        memberId: m.id,
        name: m.title,
        subject: m.details?.subject || 'Khoa học tự nhiên',
        classes: m.details?.classes || '8A1, 8A2',
        assignedPeriods,
        duties: defaultDuties,
      };
    });
  });

  const levelInfo = SCHOOL_LEVEL_NORMS[levelKey];

  function toggleDuty(memberId: string, dutyId: string) {
    setTeachers(prev =>
      prev.map(t => {
        if (t.memberId !== memberId) return t;
        const exists = t.duties.includes(dutyId);
        const nextDuties = exists ? t.duties.filter(d => d !== dutyId) : [...t.duties, dutyId];
        return { ...t, duties: nextDuties };
      })
    );
  }

  function updatePeriods(memberId: string, periods: number) {
    setTeachers(prev =>
      prev.map(t => (t.memberId === memberId ? { ...t, assignedPeriods: Math.max(0, periods) } : t))
    );
  }

  // Thống kê toàn tổ
  const stats = teachers.reduce(
    (acc, t) => {
      const calc = calculateTeacherWorkload(t.assignedPeriods, t.duties, levelKey);
      acc.totalAssigned += t.assignedPeriods;
      acc.totalTarget += calc.targetNorm;
      if (calc.status === 'balanced') acc.balancedCount++;
      if (calc.status === 'overload') acc.overloadCount++;
      if (calc.status === 'underload') acc.underloadCount++;
      return acc;
    },
    { totalAssigned: 0, totalTarget: 0, balancedCount: 0, overloadCount: 0, underloadCount: 0 }
  );

  function handleExportWord() {
    const tableHeaders = [
      'STT',
      'Họ và tên giáo viên',
      'Môn / Lớp dạy',
      'Tiết chuẩn',
      'Nhiệm vụ kiêm nhiệm (Giảm trừ)',
      'Định mức thực tế',
      'Tiết thực dạy',
      'Chênh lệch / Đánh giá',
    ];

    const tableRows = teachers.map((t, i) => {
      const calc = calculateTeacherWorkload(t.assignedPeriods, t.duties, levelKey);
      const dutyNames = t.duties
        .map(dId => DUTY_REDUCTIONS.find(d => d.id === dId))
        .filter(Boolean)
        .map(d => `${d!.name} (-${d!.reductionPeriods}t)`)
        .join(', ') || 'Không kiêm nhiệm';

      return [
        String(i + 1),
        t.name,
        `${t.subject} (${t.classes})`,
        `${calc.standardNorm} t/tuần`,
        dutyNames,
        `${calc.targetNorm} t/tuần`,
        `${calc.assignedPeriods} t/tuần`,
        `${calc.statusLabel} (${calc.balance >= 0 ? '+' : ''}${calc.balance}t)`,
      ];
    });

    const html = generateDecree30WordHtml({
      title: 'BẢNG TỔNG HỢP PHÂN CÔNG CHUYÊN MÔN & ĐỊNH MỨC TIẾT DẠY',
      documentNumber: 'Số: …/BC-ĐMTD',
      schoolName: workspace.school,
      departmentName: workspace.name,
      metaSummary: `Căn cứ Thông tư 28/2009/TT-BGDĐT & Thông tư 15/2017/TT-BGDĐT — Cấp học: ${levelInfo.name} — Năm học: ${workspace.year}`,
      signerTitle: 'TỔ TRƯỞNG CHUYÊN MÔN',
      signerName: user.name,
      secretaryTitle: 'NGƯỜI LẬP BẢNG',
      secretaryName: 'Trần Thị Hương',
      sections: [
        {
          heading: 'I. QUY ĐỊNH ĐỊNH MỨC & CHẾ ĐỘ GIẢM TRỪ',
          content: [
            `Cấp học áp dụng: ${levelInfo.name}. Định mức tiết dạy tiêu chuẩn: ${levelInfo.standardPeriodsPerWeek} tiết/tuần.`,
            `Tổng số giáo viên trong tổ: ${teachers.length} người.`,
            `Tổng số tiết được phân công: ${stats.totalAssigned} tiết/tuần (Định mức thực tế toàn tổ: ${stats.totalTarget} tiết/tuần).`,
            `Tình hình phân công: ${stats.balancedCount} giáo viên đủ định mức, ${stats.overloadCount} giáo viên thừa giờ (tăng tiết), ${stats.underloadCount} giáo viên thiếu tiết.`,
          ],
          table: {
            headers: tableHeaders,
            rows: tableRows,
          },
        },
        {
          heading: 'II. ĐỀ XUẤT VỚI BAN GIÁM HIỆU NHÀ TRƯỜNG',
          content: [
            '1. Đề nghị chi trả thừa giờ / tăng tiết cho các giáo viên vượt định mức theo quy định hiện hành.',
            '2. Bố trí phân công các công việc chuyên môn khác (phụ đạo học sinh yếu, bồi dưỡng học sinh giỏi, câu lạc bộ) cho giáo viên chưa đủ định mức tiết dạy.',
          ],
        },
      ],
      notes: [
        'Ban Giám hiệu nhà trường (để phê duyệt & tính thừa giờ);',
        'Bộ phận Kế toán - Tài vụ;',
      ],
    });

    downloadWordFile(`Bang-dinh-muc-tiet-day-${workspace.name.replace(/\s+/g, '_')}.doc`, html);
    toast.success('Đã xuất Bảng tổng hợp định mức tiết dạy chuẩn Nghị định 30!');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <section className="panel" style={{ background: 'linear-gradient(135deg, #fdfbf7 0%, #edf4fa 100%)', border: '1px solid #d4e2ee', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1a5f7a', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
              <Scale size={18} /> ĐỊNH MỨC & TẢI GIẢNG DẠY
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#10394a' }}>Định Mức Tiết Dạy & Cảnh Báo Phân Công (Thông tư 28 & TT 15)</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#56717d' }}>
              Tự động tính trừ số tiết kiêm nhiệm (Tổ trưởng -3t, Tổ phó -1t, Chủ nhiệm -4t, Thiết bị -3t) và cảnh báo thừa/thiếu tiết.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
              <span>Cấp học:</span>
              <select
                value={levelKey}
                onChange={e => setLevelKey(e.target.value as any)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', fontWeight: 600 }}
              >
                <option value="thcs">THCS (Chuẩn 19 tiết/tuần)</option>
                <option value="thpt">THPT (Chuẩn 17 tiết/tuần)</option>
                <option value="tieuhoc">Tiểu học (Chuẩn 23 tiết/tuần)</option>
              </select>
            </div>

            <button type="button" className="btn primary" onClick={handleExportWord}>
              <Download size={16} /> Xuất Bảng Định Mức (Nghị định 30)
            </button>
          </div>
        </div>
      </section>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="panel" style={{ borderLeft: '4px solid #1a5f7a', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: '#555', fontWeight: 600 }}>TỔNG TIẾT PHÂN CÔNG</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
            <strong style={{ fontSize: '24px', color: '#1a5f7a' }}>{stats.totalAssigned}</strong>
            <span style={{ fontSize: '12px', color: '#666' }}>tiết / tuần</span>
          </div>
          <small style={{ color: '#777', fontSize: '11px' }}>Tổng định mức cần: {stats.totalTarget} tiết</small>
        </div>

        <div className="panel" style={{ borderLeft: '4px solid #2b6754', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: '#555', fontWeight: 600 }}>ĐẠT ĐỊNH MỨC</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
            <strong style={{ fontSize: '24px', color: '#2b6754' }}>{stats.balancedCount}</strong>
            <span style={{ fontSize: '12px', color: '#666' }}>/ {teachers.length} giáo viên</span>
          </div>
          <small style={{ color: '#2b6754', fontSize: '11px' }}>Phân công chuẩn số tiết</small>
        </div>

        <div className="panel" style={{ borderLeft: '4px solid #d97706', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: '#555', fontWeight: 600 }}>DẠY THỪA TIẾT (TĂNG GIỜ)</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
            <strong style={{ fontSize: '24px', color: '#d97706' }}>{stats.overloadCount}</strong>
            <span style={{ fontSize: '12px', color: '#666' }}>giáo viên</span>
          </div>
          <small style={{ color: '#d97706', fontSize: '11px' }}>Đề xuất thanh toán thừa giờ</small>
        </div>

        <div className="panel" style={{ borderLeft: '4px solid #c0392b', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: '#555', fontWeight: 600 }}>THIẾU TIẾT ĐỊNH MỨC</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
            <strong style={{ fontSize: '24px', color: '#c0392b' }}>{stats.underloadCount}</strong>
            <span style={{ fontSize: '12px', color: '#666' }}>giáo viên</span>
          </div>
          <small style={{ color: '#c0392b', fontSize: '11px' }}>Cần giao thêm nhiệm vụ hỗ trợ</small>
        </div>
      </div>

      {/* Teachers Workload Table */}
      <section className="panel" style={{ overflowX: 'auto', padding: '16px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Danh Sách Phân Công & Định Mức Chi Tiết Của Giáo Viên</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--panel-alt, #f7f9f8)', borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', width: '22%' }}>Giáo viên / Môn dạy</th>
              <th style={{ padding: '8px 8px', textAlign: 'center', width: '12%' }}>Tiết thực dạy / tuần</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', width: '38%' }}>Kiêm nhiệm & Giảm trừ (TT 28)</th>
              <th style={{ padding: '8px 8px', textAlign: 'center', width: '12%' }}>Định mức yêu cầu</th>
              <th style={{ padding: '8px 8px', textAlign: 'center', width: '16%' }}>Tình trạng</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map(t => {
              const calc = calculateTeacherWorkload(t.assignedPeriods, t.duties, levelKey);
              return (
                <tr key={t.memberId} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 10px' }}>
                    <strong style={{ fontSize: '14px', color: '#1a382e' }}>{t.name}</strong>
                    <div style={{ fontSize: '12px', color: '#666' }}>{t.subject} · {t.classes}</div>
                  </td>

                  {/* Số tiết dạy */}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      value={t.assignedPeriods}
                      onChange={e => updatePeriods(t.memberId, Number(e.target.value))}
                      style={{ width: '60px', textAlign: 'center', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', fontWeight: 700 }}
                    />
                  </td>

                  {/* Kiêm nhiệm */}
                  <td style={{ padding: '8px 10px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {DUTY_REDUCTIONS.map(d => {
                        const active = t.duties.includes(d.id);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => toggleDuty(t.memberId, d.id)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              border: active ? '1px solid #2b6754' : '1px solid #ddd',
                              background: active ? '#e6f3ec' : '#fff',
                              color: active ? '#2b6754' : '#666',
                              fontWeight: active ? 600 : 400,
                              cursor: 'pointer',
                            }}
                          >
                            {d.name} (-{d.reductionPeriods}t)
                          </button>
                        );
                      })}
                    </div>
                  </td>

                  {/* Định mức thực tế sau giảm trừ */}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <strong style={{ fontSize: '14px' }}>{calc.targetNorm}</strong>
                    <small style={{ display: 'block', color: '#888', fontSize: '11px' }}>(chuẩn {calc.standardNorm} - {calc.totalReductions})</small>
                  </td>

                  {/* Tình trạng */}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: `${calc.statusColor}15`,
                        color: calc.statusColor,
                        border: `1px solid ${calc.statusColor}40`,
                      }}
                    >
                      {calc.statusLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
