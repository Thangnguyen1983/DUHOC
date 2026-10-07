# Đánh giá hiện trạng hệ thống theo sơ đồ Kaizen

Đối chiếu sơ đồ bạn gửi với hệ thống đang chạy. Trạng thái dưới đây dựa trên mã nguồn và dữ liệu thực tế trong cơ sở dữ liệu.

## 1. Website / CMS / Trang ngoài / Landing page

| Hạng mục | Trạng thái | Ghi chú thực tế |
|---|---|---|
| CMS có AI viết content, chuẩn SEO | Đã có | Trình soạn thảo + AI Writer, chuẩn hoá Markdown, sitemap động |
| Generate image bằng AI | Đã có | Trong thư viện media của CMS |
| Trang ngoài (đơn giản, thu hút hành động) | Đã có | Bộ trang du học/XKLĐ, banner quản trị theo preset |
| Landing page gắn campaign quảng cáo | Bán phần | Có chiến dịch + UTM (3 chiến dịch mẫu) và báo cáo lead, **chưa có trình tạo landing page riêng cho từng chiến dịch** |

## 2. Quản lý danh mục

| Danh mục | Trạng thái |
|---|---|
| Ngoại ngữ | Đã có (5 bản ghi) |
| Giáo viên + upload CV/bằng cấp/chứng chỉ | Có chức năng, **chưa có hồ sơ nào được tải lên (0 tài liệu)** |
| Chương trình đào tạo | Đã có |
| Loại hồ sơ theo thị trường | Đã có (14 loại) |
| Người dùng | Đã có |

## 3. Quản lý trung tâm (giáo viên, tổ chuyên môn)

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Điểm danh QR, thống kê chuyên cần | Đã có | 28 lượt điểm danh thực tế |
| Kỷ luật – khen thưởng | Đã có bảng dữ liệu | `student_conduct_records` đã tạo, chưa dùng |
| Quản lý chất lượng (điểm TX, thi) | Đã có | Bảng điểm theo loại đánh giá + trọng số |
| Nhận xét tuần/tháng/giai đoạn | Có chức năng, **0 bản ghi** | Giáo viên chưa nhập |
| Thống kê – biểu đồ theo lớp/GV | Đã có | Trang Phân tích đào tạo + Giám sát |

## 4. Quản lý người dùng theo vị trí

| Vai trò | Trạng thái |
|---|---|
| Trưởng thị trường | Đã có vai trò + quyền |
| Cán bộ quản lý hồ sơ | Đã có |
| Giáo viên trung tâm | Đã có cổng riêng `/giang-day` |
| Tuyển dụng – CSKH (chỉ đọc hồ sơ HV mình phụ trách, nhận notify) | Bán phần: có vai trò và bảng thông báo, **chưa có luồng notify tự động khi hồ sơ học viên thay đổi** |
| Telesales (notify từ chatbot, nhận khách, khoá lead, KPI) | Đã có hàng đợi + phân phối luân phiên + nhật ký (3 sales), **chưa có bảng KPI theo sales** |

## 5. E-Learning

| Hạng mục | Trạng thái |
|---|---|
| Media theo bài học (video, bài tập) | Đã có, **0 tài liệu học liệu đang lưu** |
| Kiểm tra đánh giá theo tiến độ | Đã có |
| Link nguồn miễn phí (≥1 link bắt buộc) | Đã có trường + gợi ý AI |
| Chấm mức độ hoàn thành bằng AI (thời lượng + điểm + nhận xét) | Bán phần: có công thức tiến độ, **chưa có nhận định AI** |
| Bài kiểm tra tuần/tháng/giai đoạn, đề luyện chứng chỉ, làm lại nhiều lần | Bán phần: **chỉ 1 bài kiểm tra tồn tại, chưa có ngân hàng đề theo kỳ** |

## 6. Quản lý hồ sơ du học

| Hạng mục | Trạng thái |
|---|---|
| Danh mục hồ sơ theo thị trường (bắt buộc / tuỳ chọn) | Đã có |
| Checklist sinh tự động cho từng học viên | Đã có (181 dòng cho 20 hồ sơ) |
| Tiến độ hoàn thiện realtime | Bán phần: có % hoàn thiện, **chưa bật cập nhật realtime** |
| AI kiểm tra logic hồ sơ, đối chiếu CMTC, đề xuất sửa, dự đoán tỷ lệ đạt visa | Thiếu |
| Thống kê đạt/không đạt visa theo kỳ, theo thị trường | Đã có trang Visa |

## 7. Khoảng trống lớn nhất cần làm tiếp

1. **AI rà soát hồ sơ du học** — kiểm tra đầy đủ, đối chiếu thông tin giữa các giấy tờ, cảnh báo trước khi nộp, ước lượng khả năng đạt visa.
2. **Trình tạo Landing Page theo chiến dịch** — gắn UTM, đo lead/CPL cho từng landing.
3. **Thông báo tự động (notify)** — CSKH/tuyển dụng/trưởng thị trường nhận thông báo khi học viên của mình đổi trạng thái học tập, hồ sơ, xuất cảnh.
4. **KPI Telesales** — bảng điểm theo sales dựa trên lead nhận, chốt, tỷ lệ chuyển đổi.
5. **Ngân hàng đề + kiểm tra định kỳ** — đề tuần/tháng/giai đoạn, đề luyện chứng chỉ, cho làm lại nhiều lần.
6. **Dữ liệu vận hành trống** — hồ sơ giáo viên, học liệu, nhận xét định kỳ đang là 0; cần nhập liệu hoặc tạo dữ liệu mẫu để nghiệm thu.

## Ghi chú kỹ thuật
- Mọi bảng mới đều kèm GRANT + RLS theo vai trò, `service_role` toàn quyền.
- Tính năng AI dùng cổng AI sẵn có của nền tảng; job chạy nền theo lịch, có khoá đơn luồng và con trỏ tiến độ.
- Realtime hồ sơ dùng kênh realtime của backend cho `student_document_checklist`.

## Bước tiếp theo
Chọn hạng mục ưu tiên trong 6 khoảng trống trên (đề xuất: 1 → 3 → 4), tôi sẽ lập kế hoạch chi tiết và triển khai từng phần.
