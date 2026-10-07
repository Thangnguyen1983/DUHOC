# Gộp Lịch trung tâm vào trang Giám sát lớp học

## Người dùng sẽ thấy gì

- Trang Giám sát lớp học có 2 thẻ: **Giám sát lớp** (mặc định) và **Lịch trung tâm**.
- Thẻ Lịch giữ nguyên: chuyển tuần trước / tuần này / tuần sau, lọc theo giáo viên và phòng, cảnh báo trùng phòng/trùng giáo viên tô đỏ, bấm buổi học để mở điểm danh.
- Ẩn mục **Lịch trung tâm** khỏi menu bên trái (giống cách đã ẩn Workflow 18 bước). Mở đường dẫn cũ `/admin/training/schedule` sẽ tự nhảy vào thẻ Lịch trong trang Giám sát — liên kết cũ không hỏng.
- Nút "Lịch trung tâm" trong thanh công cụ của trang Giám sát được bỏ, thay bằng thẻ chuyển đổi.

## Chi tiết kỹ thuật

- Tách phần hiển thị lịch tuần từ `src/routes/_authenticated/admin.training.schedule.tsx` thành component dùng chung `src/components/training/center-schedule.tsx` (giữ nguyên logic tuần, lọc giáo viên/phòng, phát hiện xung đột, dữ liệu từ `getSchedule` + `getTrainingOversight`).
- `admin.training.oversight.tsx`: thêm tab đọc/ghi qua query param `?tab=lich` để chia sẻ liên kết được; thẻ Lịch chỉ hiện khi người dùng có quyền `schedule.view`; tab Giám sát lớp giữ nguyên KPI, cảnh báo, bộ lọc, bảng, xuất Excel.
- `admin.training.schedule.tsx`: giữ route, nội dung chuyển thành chuyển hướng sang `/admin/training/oversight?tab=lich` (không xoá route, tránh lỗi liên kết cũ).
- `src/routes/_authenticated/route.tsx`: bỏ mục menu `Lịch trung tâm` (chỉ ẩn hiển thị, quyền và mapping giữ nguyên).
- Cập nhật liên kết trỏ tới lịch trong `src/routes/_authenticated/admin.index.tsx`, `src/routes/_authenticated/admin.van-hanh.tsx` và hướng dẫn sử dụng `src/lib/help/guides.ts` (mục Đào tạo & Trung tâm) sang thẻ mới.
- Kiểm thử: typecheck, build, bộ test hiện có (gồm test phủ route/RBAC), và mở thực tế trang Giám sát ở cả hai thẻ trên màn hình lớn và điện thoại.
