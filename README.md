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

Hồ sơ liên kết năm học, người phụ trách và hoạt động. Phê duyệt sáu bước, giữ phiên bản cũ, kiểm tra cập nhật đồng thời. Hoàn thành cuộc họp tạo biên bản và nhiệm vụ trong một giao dịch. Phân quyền kiểm tra phía máy chủ; không tin cậy header định danh từ trình duyệt.

Tệp tải qua server tối đa **4 MB** để phù hợp Vercel Functions; tệp lớn cần bổ sung upload trực tiếp có chữ ký. Tệp Supabase luôn riêng tư. Xuất Word tương thích `.doc`, CSV mở bằng Excel và PDF qua chức năng in.

## Phân quyền

Tổ trưởng quản trị tổ; Tổ phó có quyền quản lý; Giáo viên chỉ sửa dữ liệu được giao; Ban giám hiệu kiểm tra/duyệt; Khách chỉ xem dữ liệu được đánh dấu chia sẻ. Cấp quyền bằng email trước khi giáo viên đăng ký hoặc đăng nhập lần đầu. Một tài khoản hiện thuộc một tổ.

## Tích hợp

Google Drive / Calendar chưa kết nối. AI cần GEMINI_API_KEY và GEMINI_MODEL phía máy chủ. Các nút tổng hợp theo mẫu không gọi AI và luôn là bản nháp. Người quản lý phải kiểm tra trước khi lưu.

## Chuyển từ bản ChatGPT

Đây là bản Next.js dành cho GitHub/Vercel, đã loại bỏ phụ thuộc Cloudflare Workers và đăng nhập riêng của ChatGPT. Dữ liệu/tệp trên bản ChatGPT **không tự chuyển** sang Postgres/Supabase; cần bước di chuyển dữ liệu riêng nếu bản cũ đã có dữ liệu thật.

## Phát triển

`pnpm dev`, `pnpm typecheck`, `pnpm build`. Kiểm tra build không thay thế việc kiểm thử đăng nhập và lưu trữ với project Supabase thật.
