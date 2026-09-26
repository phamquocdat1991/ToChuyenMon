/**
 * Bộ công cụ Thẩm định Sáng kiến Kinh nghiệm (SKKN) chuẩn Barem 100 điểm của Bộ GD&ĐT
 * Tuân thủ Nghị định 13/2012/NĐ-CP và các văn bản chỉ đạo chuyên môn sư phạm.
 */

export interface SkknCriterion {
  id: string;
  name: string;
  maxScore: number;
  description: string;
  rubricLevels: {
    label: string;
    scoreRange: string;
    desc: string;
  }[];
}

export const SKKN_RUBRICS: SkknCriterion[] = [
  {
    id: 'crit_novelty',
    name: '1. Tính mới & Sáng tạo',
    maxScore: 30,
    description: 'Không trùng lặp, có sự cải tiến sáng tạo trong giải pháp, ứng dụng CNTT/AI hoặc đổi mới phương pháp giảng dạy.',
    rubricLevels: [
      { label: 'Xuất sắc (27-30đ)', scoreRange: '27-30', desc: 'Ý tưởng hoàn toàn mới hoặc cải tiến đột phá, tính độc đáo và dấu ấn cá nhân rõ nét.' },
      { label: 'Tốt (24-26đ)', scoreRange: '24-26', desc: 'Có nhiều điểm mới, áp dụng phương pháp tiên tiến phù hợp với đối tượng học sinh.' },
      { label: 'Khá (20-23đ)', scoreRange: '20-23', desc: 'Có cải tiến nhưng còn dựa nhiều vào các giải pháp truyền thống có sẵn.' },
      { label: 'Trung bình/Yếu (<20đ)', scoreRange: '<20', desc: 'Chưa thấy rõ điểm mới, chủ yếu lặp lại các quy định hoặc cách làm cũ.' },
    ],
  },
  {
    id: 'crit_scientific',
    name: '2. Tính khoa học & Sư phạm',
    maxScore: 30,
    description: 'Lập luận logic, thuật ngữ sư phạm chuẩn xác, quy trình biện pháp cụ thể, phù hợp tâm lý học sinh và CT GDPT 2018.',
    rubricLevels: [
      { label: 'Xuất sắc (27-30đ)', scoreRange: '27-30', desc: 'Cơ sở lý luận và thực tiễn sâu sắc, các bước biện pháp mạch lạc, tính khả thi rất cao.' },
      { label: 'Tốt (24-26đ)', scoreRange: '24-26', desc: 'Lập luận chặt chẽ, biện pháp rõ ràng, cấu trúc bài viết đạt chuẩn sư phạm.' },
      { label: 'Khá (20-23đ)', scoreRange: '20-23', desc: 'Biện pháp hợp lý nhưng phần phân tích lý luận còn sơ sài hoặc diễn đạt chưa mượt.' },
      { label: 'Trung bình/Yếu (<20đ)', scoreRange: '<20', desc: 'Biện pháp chung chung, thiếu tính cụ thể, lập luận thiếu logic.' },
    ],
  },
  {
    id: 'crit_effectiveness',
    name: '3. Tính hiệu quả & Thực nghiệm',
    maxScore: 25,
    description: 'Có số liệu đối chứng trước và sau khi áp dụng, minh chứng rõ ràng về chuyển biến phẩm chất, năng lực của học sinh.',
    rubricLevels: [
      { label: 'Xuất sắc (23-25đ)', scoreRange: '23-25', desc: 'Số liệu đối chứng định lượng và định tính tin cậy, lớp thực nghiệm vượt trội lớp đối chứng rõ rệt.' },
      { label: 'Tốt (20-22đ)', scoreRange: '20-22', desc: 'Có bảng số liệu so sánh kết quả học tập trước và sau, minh chứng thuyết phục.' },
      { label: 'Khá (16-19đ)', scoreRange: '16-19', desc: 'Có số liệu nhưng còn đơn giản, chưa có nhóm lớp đối chứng song song.' },
      { label: 'Trung bình/Yếu (<16đ)', scoreRange: '<16', desc: 'Không có số liệu thực nghiệm, chỉ nhận xét cảm tính bằng lời.' },
    ],
  },
  {
    id: 'crit_applicability',
    name: '4. Khả năng nhân rộng & Ứng dụng',
    maxScore: 15,
    description: 'Dễ chuyển giao cho đồng nghiệp trong tổ, trường bạn hoặc toàn ngành; phù hợp điều kiện thực tế cơ sở giáo dục.',
    rubricLevels: [
      { label: 'Xuất sắc (14-15đ)', scoreRange: '14-15', desc: 'Dễ dàng nhân rộng toàn trường hoặc cấp cụm trường, tài liệu hướng dẫn chuyển giao đầy đủ.' },
      { label: 'Tốt (12-13đ)', scoreRange: '12-13', desc: 'Có thể áp dụng tốt cho các lớp cùng khối trong trường.' },
      { label: 'Khá (9-11đ)', scoreRange: '9-11', desc: 'Khả năng áp dụng được nhưng đòi hỏi điều kiện cơ sở vật chất hoặc học sinh đặc thù.' },
      { label: 'Trung bình/Yếu (<9đ)', scoreRange: '<9', desc: 'Khó nhân rộng, phạm vi hẹp.' },
    ],
  },
];

export interface SkknEvaluationScore {
  novelty: number;       // 0 - 30
  scientific: number;    // 0 - 30
  effectiveness: number; // 0 - 25
  applicability: number; // 0 - 15
  feedbackSandwich?: {
    strengths: string;
    improvements: string;
    encouragement: string;
  };
  evaluatorNotes?: string;
}

export function classifySkknScore(total: number): {
  grade: string;
  badgeColor: string;
  recommendation: string;
} {
  if (total >= 90) {
    return {
      grade: 'XUẤT SẮC (Giải A)',
      badgeColor: '#2b6754',
      recommendation: 'Đủ điều kiện nộp dự thi cấp Quận/Huyện, cấp Tỉnh/Thành phố hoặc nhân rộng toàn ngành.',
    };
  }
  if (total >= 80) {
    return {
      grade: 'TỐT (Giải B)',
      badgeColor: '#3d72a4',
      recommendation: 'Đạt chất lượng cao cấp trường, đề xuất khen thưởng và áp dụng trong toàn trường.',
    };
  }
  if (total >= 70) {
    return {
      grade: 'KHÁ (Giải C)',
      badgeColor: '#c27b38',
      recommendation: 'Đạt yêu cầu sáng kiến cấp trường, nên hoàn thiện thêm phần thực nghiệm để nâng cao chất lượng.',
    };
  }
  if (total >= 50) {
    return {
      grade: 'ĐẠT (Khuyến khích)',
      badgeColor: '#8b4da3',
      recommendation: 'Đạt chuẩn công nhận sáng kiến cơ sở, cần bổ sung số liệu khảo sát đối chứng trước khi nộp cấp trên.',
    };
  }
  return {
    grade: 'CHƯA ĐẠT',
    badgeColor: '#c0392b',
    recommendation: 'Chưa đủ điều kiện công nhận. Cần rà soát lại tính mới và bổ sung minh chứng thực nghiệm sư phạm.',
  };
}

export const SAMPLE_SKKN_FIXTURES = [
  {
    id: 'sample_1',
    title: 'Ứng dụng mô hình lớp học đảo ngược (Flipped Classroom) kết hợp nền tảng số nhằm phát triển năng lực tự học của học sinh lớp 11 trong môn Tin học',
    author: 'Cô Trần Thị Hương',
    subject: 'Tin học',
    grade: '11',
    expectedScore: 93,
    summary: `• Tính mới: Chuyển đổi phương pháp truyền thống sang lớp học đảo ngược. Học sinh xem video vi mô (Micro-learning 5-7 phút) và làm quiz trên nền tảng số trước giờ học; giờ trên lớp dành 100% cho thực hành dự án và thảo luận nhóm.
• Thực trạng: Khảo sát ban đầu cho thấy 68% học sinh thụ động, chỉ nghe giảng và chép bài; điểm tự học trung bình đạt 5.4/10.
• Biện pháp: Xây dựng ngân hàng học liệu số vi mô; Thiết kế Rubric đánh giá nhiệm vụ trước giờ học; Tổ chức hoạt động giải quyết vấn đề hợp tác trong giờ học.
• Số liệu thực nghiệm (2 lớp thực nghiệm N=86, 2 lớp đối chứng N=84): Tỷ lệ học sinh đạt năng lực tự học mức Tốt tăng từ 24.1% lên 78.3% (lớp đối chứng chỉ 31.5%). Điểm kiểm tra định kỳ đạt 8.42 (so với 7.15 của đối chứng, p < 0.05).
• Khả năng nhân rộng: Đã báo cáo chuyên đề cấp Cụm trường và áp dụng hiệu quả cho cả môn Vật lý và Hóa học.`,
  },
  {
    id: 'sample_2',
    title: 'Một số biện pháp rèn luyện kỹ năng giải bài toán có lời văn cho học sinh lớp 4',
    author: 'Thầy Nguyễn Văn An',
    subject: 'Toán',
    grade: '4',
    expectedScore: 76,
    summary: `• Thực trạng: Học sinh lớp 4 thường lúng túng khi tóm tắt đề bài nhiều bước tính, hay nhầm lẫn giữa phép nhân và phép chia, kỹ năng trình bày lời giải chưa khoa học.
• Biện pháp:
  1. Hướng dẫn học sinh đọc kỹ đề bài và gạch chân các từ khóa quan trọng (nhiều hơn, ít hơn, gấp mấy lần).
  2. Rèn luyện thói quen tóm tắt đề bài bằng sơ đồ đoạn thẳng trực quan.
  3. Đa dạng hóa hình thức khen thưởng để khích lệ học sinh tự tin trình bày trước lớp.
• Kết quả thực nghiệm: Tỷ lệ học sinh làm đúng dạng toán có lời văn tăng từ 55% lên 76% sau 1 học kỳ áp dụng.
• Điểm cần hoàn thiện: Biện pháp còn mang tính truyền thống; số liệu đối chứng còn đơn giản, chưa so sánh với nhóm lớp đối chứng song song.`,
  },
  {
    id: 'sample_3',
    title: 'Nâng cao chất lượng sinh hoạt tổ chuyên môn trường THCS',
    author: 'Ban Giám Hiệu',
    subject: 'Quản lý giáo dục',
    grade: 'THCS',
    expectedScore: 47,
    summary: `• Mô tả: Đề tài phân tích tầm quan trọng của sinh hoạt tổ chuyên môn; đề xuất các tổ cần họp đúng lịch 2 tuần/lần, các giáo viên cần tích cực phát biểu đóng góp ý kiến, Ban giám hiệu cần quan tâm kiểm tra đôn đốc.
• Thiếu sót nghiêm trọng:
  - Thiếu hoàn toàn số liệu khảo sát thực trạng ban đầu (chỉ nêu chung chung "còn một số giáo viên ngại phát biểu").
  - Các giải pháp thực chất chỉ là nhắc lại quy định hành chính của ngành, không có sáng kiến hoặc giải pháp mới của cá nhân tác giả.
  - Hoàn toàn không có số liệu thực nghiệm hoặc minh chứng cụ thể chứng minh chất lượng giáo dục được nâng lên như thế nào.`,
  },
];
