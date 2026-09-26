/**
 * Công cụ thiết kế Ma Trận & Bảng Đặc Tả Đề Kiểm Tra
 * Tuân thủ Thông tư 22/2021/TT-BGDĐT và chuẩn khảo thí của Bộ GD&ĐT Việt Nam.
 */

export interface TopicMatrixRow {
  id: string;
  topicName: string; // Tên chủ đề / Mạch nội dung
  learningOutcomes: string; // Yêu cầu cần đạt (YCCĐ)
  
  // Số câu Trắc nghiệm khách quan (TNKQ)
  nhanBietTN: number;
  thongHieuTN: number;
  vanDungTN: number;
  vanDungCaoTN: number;

  // Số câu Tự luận (TL)
  nhanBietTL: number;
  thongHieuTL: number;
  vanDungTL: number;
  vanDungCaoTL: number;

  pointsPerTN: number; // Điểm mỗi câu TN (mặc định 0.25đ)
  pointTL: number;     // Tổng điểm tự luận của chủ đề này
}

export interface ExamMatrixData {
  examTitle: string; // e.g. "Kiểm tra Giữa kỳ I môn Khoa học tự nhiên 8"
  grade: string;     // e.g. "8"
  subject: string;   // e.g. "Khoa học tự nhiên"
  durationMinutes: number; // e.g. 60 phút
  mcqRatio: number;  // Tỷ lệ trắc nghiệm (e.g. 70% hoặc 40%)
  essayRatio: number;// Tỷ lệ tự luận (e.g. 30% hoặc 60%)
  rows: TopicMatrixRow[];
}

export interface ExamMatrixSummary {
  totalTNCount: number;
  totalTLCount: number;
  totalQuestions: number;
  
  nhanBietScore: number;
  thongHieuScore: number;
  vanDungScore: number;
  vanDungCaoScore: number;

  nhanBietPct: number;
  thongHieuPct: number;
  vanDungPct: number;
  vanDungCaoPct: number;

  totalScore: number;
  isStandardValid: boolean; // Tổng điểm = 10.0
  validationMessage: string;
}

export function calculateMatrixSummary(matrix: ExamMatrixData): ExamMatrixSummary {
  let totalTNCount = 0;
  let totalTLCount = 0;

  let nhanBietScore = 0;
  let thongHieuScore = 0;
  let vanDungScore = 0;
  let vanDungCaoScore = 0;

  matrix.rows.forEach(r => {
    const ptTN = r.pointsPerTN || 0.25;
    
    // TN points
    nhanBietScore += r.nhanBietTN * ptTN;
    thongHieuScore += r.thongHieuTN * ptTN;
    vanDungScore += r.vanDungTN * ptTN;
    vanDungCaoScore += r.vanDungCaoTN * ptTN;

    totalTNCount += r.nhanBietTN + r.thongHieuTN + r.vanDungTN + r.vanDungCaoTN;

    // TL points: chia đều hoặc theo trọng số mức độ
    // Nếu có câu TL, phân bổ điểm TL theo số câu
    const tlCount = r.nhanBietTL + r.thongHieuTL + r.vanDungTL + r.vanDungCaoTL;
    totalTLCount += tlCount;

    if (tlCount > 0 && r.pointTL > 0) {
      const ptEachTL = r.pointTL / tlCount;
      nhanBietScore += r.nhanBietTL * ptEachTL;
      thongHieuScore += r.thongHieuTL * ptEachTL;
      vanDungScore += r.vanDungTL * ptEachTL;
      vanDungCaoScore += r.vanDungCaoTL * ptEachTL;
    }
  });

  const totalScore = Number((nhanBietScore + thongHieuScore + vanDungScore + vanDungCaoScore).toFixed(2));
  const safeTotal = totalScore > 0 ? totalScore : 1;

  const nhanBietPct = Math.round((nhanBietScore / safeTotal) * 100);
  const thongHieuPct = Math.round((thongHieuScore / safeTotal) * 100);
  const vanDungPct = Math.round((vanDungScore / safeTotal) * 100);
  const vanDungCaoPct = Math.round((vanDungCaoScore / safeTotal) * 100);

  const isStandardValid = Math.abs(totalScore - 10.0) < 0.05;
  let validationMessage = 'Ma trận chuẩn 10.0 điểm.';
  if (!isStandardValid) {
    validationMessage = `Tổng điểm hiện tại là ${totalScore}/10.0 điểm. Cần điều chỉnh để đạt đúng 10.0 điểm.`;
  }

  return {
    totalTNCount,
    totalTLCount,
    totalQuestions: totalTNCount + totalTLCount,
    nhanBietScore: Number(nhanBietScore.toFixed(2)),
    thongHieuScore: Number(thongHieuScore.toFixed(2)),
    vanDungScore: Number(vanDungScore.toFixed(2)),
    vanDungCaoScore: Number(vanDungCaoScore.toFixed(2)),
    nhanBietPct,
    thongHieuPct,
    vanDungPct,
    vanDungCaoPct,
    totalScore,
    isStandardValid,
    validationMessage,
  };
}

export const SAMPLE_KHTN8_MATRIX: ExamMatrixData = {
  examTitle: 'Đề kiểm tra giữa học kỳ I - Khoa học tự nhiên 8',
  grade: '8',
  subject: 'Khoa học tự nhiên',
  durationMinutes: 60,
  mcqRatio: 60,
  essayRatio: 40,
  rows: [
    {
      id: 'row1',
      topicName: 'Chủ đề 1: Phản ứng hóa học và Định luật bảo toàn khối lượng',
      learningOutcomes: 'Nêu được khái niệm phản ứng hóa học, chất phản ứng, sản phẩm. Viết được phương trình chữ và lập phương trình hóa học đơn giản.',
      nhanBietTN: 4,
      thongHieuTN: 2,
      vanDungTN: 0,
      vanDungCaoTN: 0,
      nhanBietTL: 0,
      thongHieuTL: 1,
      vanDungTL: 0,
      vanDungCaoTL: 0,
      pointsPerTN: 0.25,
      pointTL: 1.0,
    },
    {
      id: 'row2',
      topicName: 'Chủ đề 2: Mol và tỷ khối của chất khí',
      learningOutcomes: 'Tính được khối lượng mol, thể tích mol chất khí ở điều kiện chuẩn. Vận dụng tính theo công thức hóa học và phương trình hóa học.',
      nhanBietTN: 3,
      thongHieuTN: 3,
      vanDungTN: 2,
      vanDungCaoTN: 0,
      nhanBietTL: 0,
      thongHieuTL: 0,
      vanDungTL: 1,
      vanDungCaoTL: 0,
      pointsPerTN: 0.25,
      pointTL: 1.5,
    },
    {
      id: 'row3',
      topicName: 'Chủ đề 3: Tốc độ phản ứng và chất xúc tác',
      learningOutcomes: 'Nêu được các yếu tố ảnh hưởng đến tốc độ phản ứng (nhiệt độ, nồng độ, diện tích tiếp xúc, chất xúc tác). Giải thích các hiện tượng thực tiễn.',
      nhanBietTN: 3,
      thongHieuTN: 2,
      vanDungTN: 1,
      vanDungCaoTN: 0,
      nhanBietTL: 0,
      thongHieuTL: 0,
      vanDungTL: 0,
      vanDungCaoTL: 0,
      pointsPerTN: 0.25,
      pointTL: 0,
    },
    {
      id: 'row4',
      topicName: 'Chủ đề 4: Acid - Base - pH và Môi trường',
      learningOutcomes: 'Nhận biết dung dịch acid, base bằng quỳ tím. Vận dụng kiến thức giải quyết vấn đề thực tiễn về đất chua, mưa acid.',
      nhanBietTN: 2,
      thongHieuTN: 1,
      vanDungTN: 1,
      vanDungCaoTN: 0,
      nhanBietTL: 0,
      thongHieuTL: 0,
      vanDungTL: 0,
      vanDungCaoTL: 1,
      pointsPerTN: 0.25,
      pointTL: 1.5,
    },
  ],
};
