# Tổ Chuyên Môn 360

Ứng dụng quản lý hồ sơ tổ chuyên môn, giao diện Bình minh Pastel, tiếng Việt, hỗ trợ máy tính và điện thoại.

## Triển khai trên Vercel

- Framework: Next.js 16 / React 19 / TypeScript.
- Database: PostgreSQL; ưu tiên Supabase để dùng cùng Auth và Storage.
- Build: `pnpm build`; install: `pnpm install --frozen-lockfile`.
- Project Vercel: `to-chuyen-mon`.

## Kích hoạt dữ liệu thật

1. Tạo hoặc kết nối một project Supabase thuộc tài khoản quản trị.
2. Chạy `db/postgres.sql` trong SQL Editor, hoặc đặt DATABASE_URL và chạy `pnpm db:migrate`. Sử dụng kết nối Postgres có quyền máy chủ (pooler URL khi dùng Supabase).
3. Tạo bucket **private** tên `chuyen-mon-files` trong Supabase Storage.
4. Thêm các biến môi trường **server-only** sau vào Vercel Production:
   - DATABASE_URL: chuỗi kết nối Postgres / Supabase pooler.
   - SUPABASE_URL: URL của project Supabase.
   - SUPABASE_ANON_KEY: publishable/anon key dùng cho Supabase Auth.
   - SUPABASE_SERVICE_ROLE_KEY: service-role key để app truy cập bucket riêng tư.
   - SUPABASE_STORAGE_BUCKET: `chuyen-mon-files`.
5. Cấu hình Site URL trong Supabase Authentication thành tên miền production. Bật xác nhận email, cấu hình SMTP khi đưa vào sử dụng thật. Đăng ký, xác nhận email rồi đăng nhập.
6. Deploy lại sau khi thêm biến môi trường. Không đưa mật khẩu hay service-role key vào GitHub hoặc frontend.

Khi chưa cấu hình dịch vụ, app hiển thị dữ liệu mẫu có nhãn. Không lưu hồ sơ vào bộ nhớ trình duyệt thay cho database. Trang đăng nhập nêu rõ trạng thái chưa kết nối.

## Các luồng đã triển khai

Dashboard, tìm kiếm, thành viên, phân công, kế hoạch, họp tổ, chuyên đề, dự giờ, tiến độ môn học, hồ sơ và minh chứng, ngân hàng đề, nhiệm vụ, lịch, thống kê.

### Nghiệp vụ Đổi mới Sư phạm (Bộ GD&ĐT)
- **Studio Thẩm định SKKN**: Barem 100 điểm (30 - 30 - 25 - 15), phân tích 4 thành tố khoa học (Biện pháp, Đối tượng, Phạm vi, Mục tiêu), phản hồi chuyên sâu Sandwich Feedback (Khen ngợi ➔ Gợi ý khắc phục ➔ Khích lệ sư phạm), xuất phiếu thẩm định chuẩn Nghị định 30/2020/NĐ-CP.
- **Ma trận & Bảng đặc tả Đề kiểm tra**: Chuẩn Thông tư 22/2021/TT-BGDĐT, 4 mức độ nhận thức (Nhận biết 40% - Thông hiểu 30% - Vận dụng 20% - Vận dụng cao 10%), tự động cân bằng 10.0 điểm, Gemini AI soạn thảo câu hỏi bám sát ma trận và bảng đặc tả.
- **Sinh hoạt chuyên môn Nghiên cứu bài học & Dự giờ 12 tiêu chí**: Quy trình 4 bước theo Công văn 1315/BGDĐT-GDTrH kết hợp Phiếu đánh giá tiết dạy 12 tiêu chí chuẩn Công văn 5512/BGDĐT, tự động phân nhóm và xếp loại.
- **Quản lý Định mức tiết dạy & Cân đối chuyên môn**: Chuẩn Thông tư 28/2009/TT-BGDĐT & Thông tư 15/2017/TT-BGDĐT, tự động trừ tiết kiêm nhiệm (Tổ trưởng, Tổ phó, GVCN, Thiết bị, Nuôi con nhỏ...), phát hiện thừa/thiếu tiết dạy.
- **Xuất văn bản Word chuẩn Nghị định 30/2020/NĐ-CP**: Đầy đủ Quốc hiệu, Tiêu ngữ, Tên cơ quan, Số hiệu, Bố cục La Mã, chữ ký thẩm quyền.
- **Đồng bộ Lịch chuyên môn iCalendar (RFC 5545)**: Xuất file `.ics` đồng bộ tức thì vào Google Calendar, Apple Calendar trên điện thoại.
- **Hỗ trợ công thức Toán - KHTN**: Nhúng KaTeX hiển thị công thức trực quan trong đề thi và bảng đặc tả.

## Phân quyền

Tổ trưởng quản trị tổ; Tổ phó có quyền quản lý; Giáo viên chỉ sửa dữ liệu được giao; Ban giám hiệu kiểm tra/duyệt; Khách chỉ xem dữ liệu được đánh dấu chia sẻ. Cấp quyền bằng email trước khi giáo viên đăng ký hoặc đăng nhập lần đầu. Một tài khoản hiện thuộc một tổ.

## Tích hợp

Google Drive / Calendar chưa kết nối. AI cần GEMINI_API_KEY và GEMINI_MODEL phía máy chủ. Các nút tổng hợp theo mẫu không gọi AI và luôn là bản nháp. Người quản lý phải kiểm tra trước khi lưu.

## Chuyển từ bản ChatGPT

Đây là bản Next.js dành cho GitHub/Vercel, đã loại bỏ phụ thuộc Cloudflare Workers và đăng nhập riêng của ChatGPT. Dữ liệu/tệp trên bản ChatGPT **không tự chuyển** sang Postgres/Supabase; cần bước di chuyển dữ liệu riêng nếu bản cũ đã có dữ liệu thật.

## Phát triển

`pnpm dev`, `pnpm typecheck`, `pnpm build`. Kiểm tra build không thay thế việc kiểm thử đăng nhập và lưu trữ với project Supabase thật.
