/**
 * Công cụ tính toán và cảnh báo Định mức tiết dạy của Giáo viên
 * theo Thông tư số 28/2009/TT-BGDĐT và Thông tư số 15/2017/TT-BGDĐT của Bộ GD&ĐT.
 */

export interface SchoolLevelNorm {
  id: 'tieuhoc' | 'thcs' | 'thpt';
  name: string;
  standardPeriodsPerWeek: number; // 23 (Tiểu học), 19 (THCS), 17 (THPT)
}

export const SCHOOL_LEVEL_NORMS: Record<string, SchoolLevelNorm> = {
  thcs: { id: 'thcs', name: 'Trung học cơ sở (THCS)', standardPeriodsPerWeek: 19 },
  thpt: { id: 'thpt', name: 'Trung học phổ thông (THPT)', standardPeriodsPerWeek: 17 },
  tieuhoc: { id: 'tieuhoc', name: 'Tiểu học', standardPeriodsPerWeek: 23 },
};

export interface ReductionDuty {
  id: string;
  name: string;
  reductionPeriods: number; // Số tiết giảm trừ mỗi tuần
}

export const DUTY_REDUCTIONS: ReductionDuty[] = [
  { id: 'to_truong', name: 'Tổ trưởng chuyên môn', reductionPeriods: 3 },
  { id: 'to_pho', name: 'Tổ phó chuyên môn', reductionPeriods: 1 },
  { id: 'chu_nhiem', name: 'Chủ nhiệm lớp (THCS/THPT)', reductionPeriods: 4 },
  { id: 'chu_nhiem_th', name: 'Chủ nhiệm lớp (Tiểu học)', reductionPeriods: 3 },
  { id: 'cong_doan', name: 'Chủ tịch công đoàn cơ sở', reductionPeriods: 3 },
  { id: 'thiet_bi', name: 'Phụ trách phòng bộ môn / Thiết bị', reductionPeriods: 3 },
  { id: 'doan_doi', name: 'Bí thư Đoàn / TPT Đội', reductionPeriods: 3 },
  { id: 'nuoi_con_nho', name: 'Giáo viên nuôi con dưới 12 tháng', reductionPeriods: 3 },
  { id: 'khac', name: 'Kiêm nhiệm khác', reductionPeriods: 1 },
];

export interface TeacherWorkloadCalculation {
  standardNorm: number;
  totalReductions: number;
  assignedPeriods: number;
  targetNorm: number; // = standardNorm - totalReductions
  balance: number; // = assignedPeriods - targetNorm
  status: 'balanced' | 'overload' | 'underload';
  statusLabel: string;
  statusColor: string;
  note: string;
}

export function calculateTeacherWorkload(
  assignedPeriods: number,
  duties: string[] = [],
  schoolLevelKey: 'thcs' | 'thpt' | 'tieuhoc' = 'thcs'
): TeacherWorkloadCalculation {
  const level = SCHOOL_LEVEL_NORMS[schoolLevelKey] || SCHOOL_LEVEL_NORMS.thcs;
  const standardNorm = level.standardPeriodsPerWeek;

  let totalReductions = 0;
  duties.forEach(dutyId => {
    const d = DUTY_REDUCTIONS.find(item => item.id === dutyId);
    if (d) totalReductions += d.reductionPeriods;
  });

  const targetNorm = Math.max(0, standardNorm - totalReductions);
  const balance = assignedPeriods - targetNorm;

  let status: 'balanced' | 'overload' | 'underload' = 'balanced';
  let statusLabel = 'Đạt chuẩn định mức';
  let statusColor = '#2b6754'; // green
  let note = `Đã phân công đủ ${assignedPeriods}/${targetNorm} tiết/tuần.`;

  if (balance > 0) {
    status = 'overload';
    statusLabel = `Dạy thừa +${balance} tiết (Tăng giờ)`;
    statusColor = '#d97706'; // amber/orange
    note = `Vượt định mức ${balance} tiết/tuần (tính thừa giờ theo quy định).`;
  } else if (balance < 0) {
    status = 'underload';
    statusLabel = `Thiếu ${Math.abs(balance)} tiết`;
    statusColor = '#c0392b'; // red
    note = `Chưa đủ định mức, còn thiếu ${Math.abs(balance)} tiết/tuần.`;
  }

  return {
    standardNorm,
    totalReductions,
    assignedPeriods,
    targetNorm,
    balance,
    status,
    statusLabel,
    statusColor,
    note,
  };
}
