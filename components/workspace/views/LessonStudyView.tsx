'use client';
import { useState } from 'react';
import { Eye, BookOpen, Users, CheckCircle2, Download, Sparkles, MessageSquare, ChevronRight, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { LESSON_STUDY_STEPS, CV5512_OBSERVATION_CRITERIA, classifyObservationScore } from '@/lib/lesson-study';
import { generateDecree30WordHtml, downloadWordFile } from '@/lib/export-doc';

interface LessonStudyViewProps {
  workspace: { name: string; school: string; year: string };
  user: { name: string; role: string };
  members: any[];
}

export default function LessonStudyView({ workspace, user, members }: LessonStudyViewProps) {
  const [activeTab, setActiveTab] = useState<'flow' | 'observation'>('flow');
  const [currentStep, setCurrentStep] = useState(1);

  // Form dự giờ CV 5512
  const [lessonTitle, setLessonTitle] = useState('Bài 27: Acetic Acid (Axit axetic) — Khoa học tự nhiên 9');
  const [teacherName, setTeacherName] = useState(members[1]?.title || 'Thầy Nguyễn Văn An');
  const [observerName, setObserverName] = useState(user.name);
  const [className, setClassName] = useState('9A1');
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 10));

  // Điểm số 12 tiêu chí
  const [scores, setScores] = useState<Record<string, number>>({
    c1: 0.9, c2: 0.7, c3: 0.7, // Nhóm I (max 2.5) => 2.3
    c4: 0.9, c5: 0.85, c6: 0.7, c7: 0.7, // Nhóm II (max 3.5) => 3.15
    c8: 0.9, c9: 0.9, c10: 0.7, c11: 0.7, c12: 0.45, // Nhóm III (max 4.0) => 3.65
  });

  const [studentEvidenceNote, setStudentEvidenceNote] = useState(
    'Học sinh nhóm 2 và nhóm 4 thảo luận rất sôi nổi khi tiến hành thí nghiệm nhận biết tính chất của axit axetic với quỳ tím và đá vôi. Học sinh tự tay lắp ráp dụng cụ và ghi chép hiện tượng chuẩn xác. Nhóm 1 có 2 em còn lúng túng khi giải thích phản ứng este hóa, giáo viên đã kịp thời gợi mở hỗ trợ.'
  );
  const [generalComment, setGeneralComment] = useState(
    'Tiết dạy chuẩn bị chu đáo theo định hướng phát triển phẩm chất, năng lực học sinh (CV 5512). Hoạt động học của học sinh chiếm hơn 70% thời lượng. Không khí học tập hào hứng, thân thiện.'
  );

  const totalScore = Number(Object.values(scores).reduce((a, b) => a + b, 0).toFixed(2));
  const rankInfo = classifyObservationScore(totalScore);

  function handleExportObservationWord() {
    const tableHeaders = ['STT', 'Tiêu chí đánh giá (theo Công văn 5512/BGDĐT)', 'Điểm tối đa', 'Điểm đánh giá'];
    const tableRows: (string | number)[][] = [];

    CV5512_OBSERVATION_CRITERIA.forEach((group, gIdx) => {
      tableRows.push(['', group.groupName, `${group.maxPoints} đ`, '']);
      group.criteria.forEach((c) => {
        tableRows.push([c.id.toUpperCase(), c.name, `${c.maxPoints} đ`, `${scores[c.id] || 0} đ`]);
      });
    });

    tableRows.push(['', 'TỔNG CỘNG ĐIỂM TIẾT DẠY', '10.0 đ', `${totalScore} đ (${rankInfo.rank})`]);

    const html = generateDecree30WordHtml({
      title: 'PHIẾU ĐÁNH GIÁ TIẾT DẠY THEO CÔNG VĂN 5512/BGDĐT',
      documentNumber: 'Số: …/PĐG-5512',
      schoolName: workspace.school,
      departmentName: workspace.name,
      metaSummary: `Tiết dạy minh họa: ${lessonTitle} — Lớp: ${className} — Ngày: ${dateStr}`,
      signerTitle: 'NGƯỜI DỰ GIỜ / TỔ TRƯỞNG',
      signerName: observerName,
      secretaryTitle: 'GIÁO VIÊN ĐƯỢC DỰ GIỜ',
      secretaryName: teacherName,
      sections: [
        {
          heading: 'I. THÔNG TIN TIẾT DẠY MINH HỌA',
          content: [
            `Tên bài dạy: ${lessonTitle}`,
            `Giáo viên thực hiện: ${teacherName}`,
            `Người dự giờ / quan sát: ${observerName}`,
            `Lớp: ${className} — Thời gian: ${dateStr}`,
            `Thuộc chuỗi sinh hoạt chuyên môn: Nghiên cứu bài học (Công văn 1315/BGDĐT-GDTrH)`,
          ],
        },
        {
          heading: 'II. BẢNG ĐIỂM ĐÁNH GIÁ THEO 12 TIÊU CHÍ (CÔNG VĂN 5512)',
          content: `Tổng điểm đạt được: ${totalScore}/10.0 điểm. Xếp loại tiết dạy: ${rankInfo.rank}.`,
          table: {
            headers: tableHeaders,
            rows: tableRows,
          },
        },
        {
          heading: 'III. MINH CHỨNG HOẠT ĐỘNG HỌC CỦA HỌC SINH & GÓP Ý CHUYÊN MÔN',
          content: [
            `Minh chứng quan sát hoạt động học sinh:\n${studentEvidenceNote}`,
            `Nhận xét chung và đúc kết sư phạm:\n${generalComment}`,
            `Kết luận: ${rankInfo.summary}`,
          ],
        },
      ],
      notes: [
        'Lưu hồ sơ sinh hoạt chuyên môn của tổ;',
        'Giáo viên dạy minh họa (để hoàn thiện bài dạy);',
      ],
    });

    downloadWordFile(`Phieu-du-gio-5512-${teacherName.replace(/\s+/g, '_')}.doc`, html);
    toast.success('Đã xuất Phiếu dự giờ chuẩn Công văn 5512 (.doc)!');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner */}
      <section className="panel" style={{ background: 'linear-gradient(135deg, #fefcf9 0%, #f4f8f4 100%)', border: '1px solid #dce8dd', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2b6754', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
              <Eye size={18} /> ĐỔI MỚI SINH HOẠT CHUYÊN MÔN
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#1a382e' }}>Nghiên Cứu Bài Học & Phiếu Dự Giờ CV 5512</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#5b6b64' }}>
              Thực hiện theo Công văn 1315/BGDĐT-GDTrH (Quy trình 4 bước) và tiêu chuẩn đánh giá tiết dạy chuẩn Công văn 5512/BGDĐT.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className={activeTab === 'flow' ? 'btn primary' : 'btn light'}
              onClick={() => setActiveTab('flow')}
              style={{ fontSize: '13px' }}
            >
              <BookOpen size={16} /> Quy trình 4 bước NCBH
            </button>
            <button
              type="button"
              className={activeTab === 'observation' ? 'btn primary' : 'btn light'}
              onClick={() => setActiveTab('observation')}
              style={{ fontSize: '13px' }}
            >
              <Eye size={16} /> Phiếu dự giờ CV 5512 ({totalScore}đ)
            </button>
          </div>
        </div>
      </section>

      {/* Tab 1: Lesson Study 4 Steps Workflow */}
      {activeTab === 'flow' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {LESSON_STUDY_STEPS.map((step) => {
              const isActive = currentStep === step.step;
              return (
                <button
                  key={step.step}
                  type="button"
                  onClick={() => setCurrentStep(step.step)}
                  className="panel"
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: isActive ? '2px solid #2b6754' : '1px solid var(--border)',
                    background: isActive ? '#f3f9f5' : '#ffffff',
                    padding: '16px',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: isActive ? '#2b6754' : '#e6ede8',
                      color: isActive ? '#fff' : '#2b6754',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '13px',
                    }}>
                      {step.step}
                    </span>
                    {isActive && <CheckCircle2 size={16} style={{ color: '#2b6754' }} />}
                  </div>
                  <strong style={{ fontSize: '14px', color: '#1a382e', display: 'block', marginBottom: '4px' }}>
                    {step.title.split(':')[1] || step.title}
                  </strong>
                  <p style={{ margin: 0, fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
                    {step.shortDesc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Current Step Detailed Checklist */}
          {(() => {
            const current = LESSON_STUDY_STEPS[currentStep - 1];
            return (
              <section className="panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2b6754', marginBottom: '8px' }}>
                  <Users size={20} />
                  <h3 style={{ margin: 0, fontSize: '17px' }}>{current.title}</h3>
                </div>
                <p style={{ color: '#555', fontSize: '13.5px', marginBottom: '16px' }}>{current.shortDesc}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#333' }}>Các hoạt động trọng tâm của Tổ chuyên môn:</span>
                  {current.keyActions.map((action, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        background: '#fcfbf8',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid #eee',
                        fontSize: '13px',
                      }}
                    >
                      <CheckCircle2 size={16} style={{ color: '#2b6754', marginTop: '2px', flexShrink: 0 }} />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  {currentStep < 4 ? (
                    <button type="button" className="btn primary" onClick={() => setCurrentStep(currentStep + 1)}>
                      Chuyển sang Bước {currentStep + 1} <ChevronRight size={15} />
                    </button>
                  ) : (
                    <button type="button" className="btn primary" onClick={() => setActiveTab('observation')}>
                      Mở Phiếu Dự Giờ CV 5512 <Eye size={15} />
                    </button>
                  )}
                </div>
              </section>
            );
          })()}
        </div>
      )}

      {/* Tab 2: Observation Rubric Form (CV 5512) */}
      {activeTab === 'observation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Metadata Controls */}
          <div className="panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', padding: '14px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600, minWidth: '240px', flex: 1 }}>
              Tên bài dạy minh họa
              <input
                value={lessonTitle}
                onChange={e => setLessonTitle(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600, width: '160px' }}>
              Giáo viên dạy
              <input
                value={teacherName}
                onChange={e => setTeacherName(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600, width: '160px' }}>
              Người dự giờ
              <input
                value={observerName}
                onChange={e => setObserverName(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600, width: '80px' }}>
              Lớp
              <input
                value={className}
                onChange={e => setClassName(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600, width: '130px' }}>
              Ngày dự giờ
              <input
                type="date"
                value={dateStr}
                onChange={e => setDateStr(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }}
              />
            </label>
          </div>

          {/* Total Score & Rating Banner */}
          <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: `${rankInfo.color}10`, borderLeft: `5px solid ${rankInfo.color}` }}>
            <div>
              <span style={{ fontSize: '12px', color: '#555', fontWeight: 600 }}>TỔNG ĐIỂM ĐÁNH GIÁ TIẾT DẠY (THANG 10)</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '2px' }}>
                <strong style={{ fontSize: '26px', color: rankInfo.color }}>{totalScore} / 10.0 đ</strong>
                <span style={{ fontWeight: 700, fontSize: '16px', color: rankInfo.color }}>— Xếp loại: {rankInfo.rank}</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#444' }}>{rankInfo.summary}</p>
            </div>

            <button type="button" className="btn primary" onClick={handleExportObservationWord}>
              <Download size={16} /> Xuất Phiếu Dự Giờ Word (NĐ 30)
            </button>
          </div>

          {/* 12 Criteria Groups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {CV5512_OBSERVATION_CRITERIA.map((group) => {
              const groupScore = Number(
                group.criteria.reduce((sum, c) => sum + (scores[c.id] || 0), 0).toFixed(2)
              );
              return (
                <section key={group.groupName} className="panel" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#2b6754' }}>{group.groupName}</h3>
                    <strong style={{ fontSize: '14px', color: '#2b6754' }}>{groupScore} / {group.maxPoints} đ</strong>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {group.criteria.map((c) => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', background: '#fafaf8', padding: '10px 12px', borderRadius: '6px' }}>
                        <div style={{ flex: 1, minWidth: '260px' }}>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{c.name}</div>
                          <small style={{ color: '#777', fontSize: '11px' }}>{c.description}</small>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="range"
                            min="0"
                            max={c.maxPoints}
                            step="0.05"
                            value={scores[c.id] ?? c.maxPoints * 0.8}
                            onChange={e => setScores({ ...scores, [c.id]: Number(e.target.value) })}
                            style={{ width: '100px', accentColor: '#2b6754' }}
                          />
                          <span style={{ fontWeight: 700, width: '60px', textAlign: 'right', fontSize: '13px' }}>
                            {(scores[c.id] ?? 0).toFixed(2)} / {c.maxPoints}đ
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Student Activity Observation & General Comment */}
          <section className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
              Minh chứng hoạt động học của học sinh (hình ảnh, hành vi, khó khăn học sinh gặp phải):
              <textarea
                rows={3}
                value={studentEvidenceNote}
                onChange={e => setStudentEvidenceNote(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', lineHeight: '1.5' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
              Nhận xét chung và đúc kết sư phạm cho tổ:
              <textarea
                rows={3}
                value={generalComment}
                onChange={e => setGeneralComment(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', lineHeight: '1.5' }}
              />
            </label>
          </section>
        </div>
      )}
    </div>
  );
}
