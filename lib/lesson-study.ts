/**
 * Quy trình Sinh hoạt chuyên môn theo Nghiên cứu bài học (Công văn 1315/BGDĐT-GDTrH)
 * và Tiêu chuẩn đánh giá tiết dạy chuẩn Công văn 5512/BGDĐT của Bộ GD&ĐT.
 */

export interface LessonStudyPhase {
  step: number;
  title: string;
  shortDesc: string;
  keyActions: string[];
}

export const LESSON_STUDY_STEPS: LessonStudyPhase[] = [
  {
    step: 1,
    title: 'Bước 1: Thiết kế bài học minh họa',
    shortDesc: 'Xác định mục tiêu bài học, xây dựng kế hoạch bài dạy minh họa, chuẩn bị học liệu số và dự đoán khó khăn của học sinh.',
    keyActions: [
      'Tổ chuyên môn họp thảo luận, lựa chọn bài học và phân công giáo viên biên soạn.',
      'Soạn KHBD theo 4 hoạt động của Công văn 5512 (Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng).',
      'Cả tổ cùng góp ý, dự kiến các tình huống học sinh lúng túng hoặc chưa hiểu.',
    ],
  },
  {
    step: 2,
    title: 'Bước 2: Tổ chức dạy học & Quan sát hoạt động của học sinh',
    shortDesc: 'Dự giờ tập trung ghi nhận hoạt động học của học sinh: sự tham gia, sự tương tác nhóm, biểu hiện khó khăn, không phê phán giáo viên dạy.',
    keyActions: [
      'Giáo viên dạy minh họa linh hoạt điều chỉnh theo phản ứng thực tế của học sinh.',
      'Người dự giờ chọn vị trí thuận lợi để quan sát nét mặt, thao tác, sản phẩm học tập của học sinh.',
      'Ghi hình, chụp ảnh hoặc ghi chép lại các thời điểm học sinh gặp vướng mắc.',
    ],
  },
  {
    step: 3,
    title: 'Bước 3: Phân tích bài học (Suy ngẫm & Chia sẻ)',
    shortDesc: 'Thảo luận dựa trên bằng chứng quan sát thực tế; tìm nguyên nhân học sinh chưa hiểu và đề xuất biện pháp khắc phục.',
    keyActions: [
      'Giáo viên dạy minh họa chia sẻ mục tiêu đã đạt được và những điều chưa như ý.',
      'Các giáo viên dự giờ chia sẻ minh chứng cụ thể quan sát được ở từng nhóm học sinh.',
      'Tập trung bàn luận: Vì sao học sinh chưa làm được? Cần thay đổi lệnh hỏi, đồ dùng hay thời gian?',
    ],
  },
  {
    step: 4,
    title: 'Bước 4: Vận dụng vào thực tiễn bài dạy hàng ngày',
    shortDesc: 'Đúc kết bài học sư phạm, hoàn thiện kế hoạch bài dạy chuẩn lưu vào kho học liệu của tổ để mọi giáo viên áp dụng.',
    keyActions: [
      'Chỉnh sửa và chuẩn hóa Kế hoạch bài dạy đã dạy thử nghiệm.',
      'Mỗi giáo viên chủ động điều chỉnh phương pháp vào các lớp mình đang phụ trách.',
      'Lưu biên bản và sản phẩm vào kho dữ liệu chuyên môn dùng chung của trường.',
    ],
  },
];

export interface Cv5512CriteriaGroup {
  groupName: string;
  maxPoints: number;
  criteria: {
    id: string;
    name: string;
    maxPoints: number;
    description: string;
  }[];
}

export const CV5512_OBSERVATION_CRITERIA: Cv5512CriteriaGroup[] = [
  {
    groupName: 'I. KẾ HOẠCH VÀ TÀI LIỆU DẠY HỌC (Tối đa 2.5 điểm)',
    maxPoints: 2.5,
    criteria: [
      {
        id: 'c1',
        name: '1. Mức độ phù hợp của chuỗi hoạt động học với mục tiêu, nội dung và phương pháp dạy học',
        maxPoints: 1.0,
        description: 'Các hoạt động logic, liền mạch, hướng tới đạt được YCCĐ về phẩm chất và năng lực.',
      },
      {
        id: 'c2',
        name: '2. Mức độ rõ ràng của mục tiêu, nội dung, kỹ thuật tổ chức và sản phẩm cần đạt của mỗi nhiệm vụ',
        maxPoints: 0.75,
        description: 'Nhiệm vụ giao cho học sinh rõ ràng về cách thức thực hiện và kết quả đầu ra.',
      },
      {
        id: 'c3',
        name: '3. Mức độ phù hợp của thiết bị dạy học và học liệu được sử dụng',
        maxPoints: 0.75,
        description: 'Học liệu số, đồ dùng thí nghiệm, phiếu học tập phát huy tối đa tính chủ động của học sinh.',
      },
    ],
  },
  {
    groupName: 'II. HOẠT ĐỘNG DẠY CỦA GIÁO VIÊN (Tối đa 3.5 điểm)',
    maxPoints: 3.5,
    criteria: [
      {
        id: 'c4',
        name: '4. Mức độ sinh động, hấp dẫn của phương pháp và hình thức chuyển giao nhiệm vụ học tập',
        maxPoints: 1.0,
        description: 'Cách đặt vấn đề cuốn hút, gợi mở tò mò, học sinh sẵn sàng và hào hứng tiếp nhận.',
      },
      {
        id: 'c5',
        name: '5. Khả năng theo dõi, quan sát, phát hiện kịp thời những khó khăn của học sinh',
        maxPoints: 1.0,
        description: 'Bao quát lớp học, nhận biết nhóm/cá nhân học sinh gặp lúng túng để có biện pháp hỗ trợ.',
      },
      {
        id: 'c6',
        name: '6. Mức độ phù hợp, hiệu quả của các biện pháp hỗ trợ và khuyến khích học sinh hợp tác',
        maxPoints: 0.75,
        description: 'Gợi ý khéo léo, không làm thay, tạo cơ hội cho học sinh tự tìm ra giải pháp.',
      },
      {
        id: 'c7',
        name: '7. Mức độ chính xác, kịp thời trong nhận xét, đánh giá kết quả hoạt động học của học sinh',
        maxPoints: 0.75,
        description: 'Đánh giá vì sự tiến bộ của người học, phản hồi động viên và định hướng sửa sai rõ ràng.',
      },
    ],
  },
  {
    groupName: 'III. HOẠT ĐỘNG HỌC CỦA HỌC SINH (Tối đa 4.0 điểm)',
    maxPoints: 4.0,
    criteria: [
      {
        id: 'c8',
        name: '8. Khả năng tiếp nhận và sẵn sàng thực hiện nhiệm vụ học tập của tất cả học sinh',
        maxPoints: 1.0,
        description: 'Tất cả học sinh đều hiểu nhiệm vụ và bắt tay vào việc ngay, không đứng ngoài hoạt động.',
      },
      {
        id: 'c9',
        name: '9. Mức độ tích cực, chủ động, sáng tạo, hợp tác của học sinh trong thực hiện nhiệm vụ',
        maxPoints: 1.0,
        description: 'Học sinh hăng hái thảo luận nhóm, biết lắng nghe, phân công và phản biện tích cực.',
      },
      {
        id: 'c10',
        name: '10. Mức độ tham gia tích cực của học sinh trong trình bày, trao đổi, thảo luận kết quả',
        maxPoints: 0.75,
        description: 'Tự tin trình bày sản phẩm học tập, biết đặt câu hỏi và tranh luận văn minh.',
      },
      {
        id: 'c11',
        name: '11. Mức độ đúng đắn, chính xác, phù hợp của các kết quả học tập / sản phẩm học sinh đạt được',
        maxPoints: 0.75,
        description: 'Sản phẩm giải quyết được mục tiêu bài học, kiến thức thu nhận chuẩn xác.',
      },
      {
        id: 'c12',
        name: '12. Thái độ, cảm xúc và sự hào hứng của học sinh trong suốt tiết học',
        maxPoints: 0.5,
        description: 'Học sinh vui vẻ, tập trung, cảm nhận được niềm vui khám phá tri thức.',
      },
    ],
  },
];

export function classifyObservationScore(score: number): {
  rank: string;
  color: string;
  summary: string;
} {
  if (score >= 8.5) return { rank: 'GIỎI', color: '#2b6754', summary: 'Tiết dạy xuất sắc, đổi mới phương pháp rõ nét, học sinh chủ động hoàn toàn.' };
  if (score >= 7.0) return { rank: 'KHÁ', color: '#3d72a4', summary: 'Tiết dạy đạt chất lượng khá, các hoạt động diễn ra nhịp nhàng, hiệu quả.' };
  if (score >= 5.0) return { rank: 'TRUNG BÌNH', color: '#c27b38', summary: 'Đạt yêu cầu cơ bản, cần tăng cường giao quyền chủ động cho học sinh.' };
  return { rank: 'CHƯA ĐẠT', color: '#c0392b', summary: 'Chưa đạt yêu cầu, cần tổ chức dự giờ tư vấn hỗ trợ giáo viên lần sau.' };
}
