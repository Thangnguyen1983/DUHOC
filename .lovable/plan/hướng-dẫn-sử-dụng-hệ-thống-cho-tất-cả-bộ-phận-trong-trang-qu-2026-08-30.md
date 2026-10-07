# Hướng dẫn sử dụng hệ thống cho tất cả bộ phận (trong trang quản trị)

## Mini-PRD
1. Mục tiêu kinh doanh: rút ngắn thời gian đào tạo nhân sự mới, giảm thao tác sai trên hệ thống.
2. Đối tượng: cán bộ nội bộ dùng trang quản trị (marketing/CMS, telesales, tư vấn, đào tạo, giáo viên, visa/hồ sơ, khoá học online, quản trị hệ thống).
3. CTA chính: nút "Hướng dẫn" trên thanh bên → `/admin/huong-dan`, và nút trợ giúp theo trang.
4. Nội dung chính: hướng dẫn theo bộ phận (việc thường ngày, các bước thao tác), quy tắc dữ liệu (không tạo trùng hồ sơ, khoá lead, gắn UTM), câu hỏi thường gặp + xử lý lỗi hay gặp.
5. SEO: không áp dụng (trang nội bộ, đặt `noindex`).
6. Success metric: mỗi bộ phận có ít nhất 1 bài hướng dẫn đầy đủ; nhân sự mới tự thao tác được sau khi đọc, không cần hỏi lại admin.
7. Edge case: mobile, người dùng chỉ có 1 vai trò (chỉ thấy phần liên quan), nội dung dài (mục lục + tìm kiếm), in ra giấy.
8. Rollback: xoá mục "Hướng dẫn" khỏi thanh bên và xoá route — không ảnh hưởng module khác.

## Phạm vi

Thêm khu vực **Hướng dẫn sử dụng** trong trang quản trị, gồm:

- `/admin/huong-dan` — trang chính: danh sách bộ phận dạng thẻ, ô tìm kiếm, lọc theo vai trò của chính người đang đăng nhập (mặc định hiện phần liên quan tới mình, có nút "Xem tất cả").
- `/admin/huong-dan/$slug` — trang chi tiết từng bộ phận: mục lục bên phải, các bước thao tác đánh số, ảnh/ghi chú cảnh báo, liên kết đi thẳng tới màn hình tương ứng trong hệ thống.
- Nút trợ giúp ở đầu các màn hình chính (Lead, Hồ sơ học viên, Lớp học, CMS, Khoá học, Tài khoản) mở đúng mục hướng dẫn của màn hình đó.

## Các bộ phận và nội dung hướng dẫn

1. **Bắt đầu nhanh** — đăng nhập, hiểu vai trò/quyền, bố cục thanh bên, quy tắc chung về dữ liệu.
2. **Marketing & Nội dung (CMS)** — viết bài bằng AI, chuẩn SEO, chèn ảnh/video, banner trang chủ & các trang, chương trình hot, popup, chiến dịch + UTM, thư viện media.
3. **Telesales & Lead** — luồng lead vào, hàng đợi, nhận khách, khoá lead, hết hạn chuyển người khác, chốt khách → tạo hồ sơ, đọc bảng KPI.
4. **Tư vấn & CSKH** — theo dõi học viên phụ trách, ghi chú tương tác, thông báo tự động.
5. **Đào tạo & Trung tâm** — chương trình, lớp học, xếp lịch và cảnh báo trùng lịch, phân công giáo viên, giám sát lớp, thống kê đào tạo, danh mục hệ thống.
6. **Giáo viên** — cổng `/giang-day`: điểm danh QR, buổi học, bảng điểm, nhận xét định kỳ, học liệu, bài kiểm tra.
7. **Hồ sơ du học & Visa** — hồ sơ học viên, checklist theo thị trường, % hoàn thiện, rà soát hồ sơ bằng AI, cập nhật trạng thái visa, thống kê visa.
8. **Workflow & Xuất cảnh** — 18 bước, SLA, cấp tài khoản học viên.
9. **Khoá học online** — tạo khoá, bài học, giá & mã giảm giá, đơn hàng, thanh toán, chứng chỉ.
10. **Chatbot** — tri thức, system prompt, huấn luyện, xem hội thoại.
11. **Quản trị hệ thống** — tài khoản & phân quyền, đặt lại mật khẩu, cài đặt thanh toán, email, Telegram.

Mỗi bài gồm: "Bạn làm gì ở đây", "Các bước thao tác", "Quy tắc bắt buộc", "Lỗi hay gặp & cách xử lý", "Liên kết nhanh".

## Ghi chú kỹ thuật

- Nội dung lưu dạng dữ liệu tĩnh trong mã nguồn (`src/lib/help/guides.ts`) — không tạo bảng mới, không cần phân quyền dữ liệu; toàn bộ trang nằm sau lớp đăng nhập sẵn có.
- Lọc theo vai trò dùng `useMyAccess()` sẵn có; mỗi bài khai báo danh sách quyền liên quan.
- Trang chi tiết đặt `robots: noindex` trong `head()`.
- Thêm 1 mục điều hướng "Hướng dẫn sử dụng" ở cuối thanh bên, hiển thị cho mọi vai trò.

## Bước tiếp theo
Duyệt kế hoạch, tôi sẽ dựng khung trang + điều hướng trước, rồi viết đủ nội dung 11 bộ phận.
