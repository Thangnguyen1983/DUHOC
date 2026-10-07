# Kế hoạch: Phân hệ Quản trị Nhân sự & Cổng CTV

Triển khai theo 5 đợt nhỏ, mỗi đợt xong là dùng được ngay, có kiểm thử và hướng dẫn.

## Đợt 1 — Trang "Nhân sự" gom một chỗ (/admin/nhan-su)
- Menu mới "Nhân sự" với các thẻ: Danh sách nhân sự | Phòng ban | Chức danh | Cộng tác viên.
- Danh sách nhân sự: mã KZ-NV, họ tên, phòng ban chính, chức danh, trạng thái; lọc theo phòng ban; mở hồ sơ cán bộ hiện có (không tạo hồ sơ song song).
- Phòng ban/Chức danh: dùng lại đúng danh mục hiện có (thẻ trong Danh mục hệ thống vẫn giữ, cùng một dữ liệu), thêm số nhân sự mỗi phòng.
- Cộng tác viên: danh sách KZ-CTV, cán bộ phụ trách, số hồ sơ giới thiệu, tổng hoa hồng.

## Đợt 2 — Hợp đồng lao động
- Mỗi nhân sự có nhiều hợp đồng: số HĐ, loại (thử việc / xác định thời hạn / không thời hạn / cộng tác), ngày bắt đầu–kết thúc, lương cơ bản, tệp scan.
- Cảnh báo hợp đồng sắp hết hạn 30 ngày (thông báo cho Nhân sự & Ban Giám đốc).

## Đợt 3 — Nghỉ phép & Chấm công
- Nhân viên tự gửi đơn nghỉ (loại nghỉ, từ–đến, lý do); trưởng phòng duyệt/từ chối; số ngày phép còn lại theo năm.
- Chấm công theo ngày: nhân viên bấm Vào/Ra trên điện thoại; Nhân sự sửa có ghi lý do; bảng công tháng xuất Excel.

## Đợt 4 — Lương & KPI
- Bảng lương tháng: lương cơ bản (từ hợp đồng) + phụ cấp + thưởng KPI − khấu trừ, tính theo ngày công thực tế.
- KPI: chỉ tiêu theo tháng cho từng người; số liệu Sale (lead chốt) tự lấy từ hệ thống, còn lại nhập tay.
- Khoá bảng lương sau khi Ban Giám đốc duyệt; nhân viên chỉ xem phiếu lương của mình.
- Công thức bảo hiểm/thuế TNCN: tạm để ô nhập tay cho tới khi Kaizen gửi quy định.

## Đợt 5 — Cổng riêng cho CTV (/ctv)
- Giao diện tối giản trên điện thoại, chỉ 3 mục: Giới thiệu ứng viên (4 trường), Ứng viên của tôi (tiến độ), Hoa hồng của tôi.
- CTV chỉ thấy dữ liệu của chính mình; ứng viên gửi lên vào hàng Lead của phòng phụ trách.

## Áp dụng chung mỗi đợt
- Tự đăng ký quyền (xem/quản lý) vào Tài khoản & Quyền, thêm hướng dẫn và quy trình từng bước.
- Phân lập theo phòng ban: trưởng phòng chỉ thấy nhân sự phòng mình; dữ liệu lương chỉ Nhân sự & Ban Giám đốc.
- Kiểm tra hiển thị 320–1920px, thêm mục vào trang Kiểm nghiệm & Bàn giao.

## Chi tiết kỹ thuật
- Bảng mới: staff_contracts, leave_requests, leave_balances, attendance_days, kpi_targets, payroll_periods, payroll_items; tất cả gắn staff_profiles.user_id, có RLS + GRANT.
- CTV đăng nhập bằng tài khoản có vai trò contributor liên kết sales_agents.user_id.
- Đọc/ghi qua createServerFn + requireSupabaseAuth, kiểm quyền và phạm vi phòng ban phía máy chủ.

Đề xuất bắt đầu Đợt 1 + Đợt 5 trước (nhanh, dùng ngay), sau đó 2 → 3 → 4.
