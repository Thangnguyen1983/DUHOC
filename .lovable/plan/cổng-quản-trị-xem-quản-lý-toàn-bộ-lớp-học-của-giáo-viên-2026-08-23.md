# Cổng quản trị: xem & quản lý toàn bộ lớp học của giáo viên

## Hiện trạng (đã kiểm tra trong mã nguồn)

- `/admin/training/classes`: danh sách lớp, mở lớp mới, sửa/xoá.
- `/admin/training/classes/:id`: ghi danh học viên, tạo buổi học, điểm danh, bảng điểm, cấp chứng chỉ.
- `/giang-day`: cổng giáo viên. Logic `isStaff` đã cho `admin`, `training_manager`, `training_staff` thấy **tất cả** lớp, nhưng trong Admin console không có đường dẫn nào tới cổng này, và không có màn hình nào nhìn xuyên suốt "giáo viên nào đang dạy gì, lớp nào chưa điểm danh, chưa nhập điểm".

## Sẽ bổ sung

### 1. Trang giám sát đào tạo `/admin/training/oversight`
Một màn hình tổng chỉ huy cho quản trị/giáo vụ:
- Thẻ số liệu: tổng lớp đang học, số buổi trong tuần, số buổi quá hạn chưa điểm danh, tỉ lệ chuyên cần trung bình, số lớp chưa có giáo viên.
- Bảng "Lớp học toàn hệ thống": mã lớp, tên, chương trình, giáo viên phụ trách, sĩ số, tiến độ buổi (đã dạy/tổng), % chuyên cần, số buổi chưa điểm danh, trạng thái. Lọc theo giáo viên, chương trình, trạng thái lớp, khoảng thời gian; tìm theo mã/tên; xuất Excel.
- Bảng "Theo giáo viên": mỗi giáo viên — số lớp, số học viên, số buổi tuần này, số buổi chưa điểm danh, số điểm chưa nhập. Bấm vào lọc nhanh bảng lớp.
- Danh sách cảnh báo: buổi quá hạn chưa điểm danh, lớp trùng phòng/trùng giờ giáo viên, lớp sắp kết thúc chưa nhập điểm cuối.

### 2. Quản trị thao tác thay giáo viên
- Trong bảng lớp: nút "Vào lớp" mở màn quản lý lớp đầy đủ (điểm danh, điểm số, báo cáo) với đúng bộ công cụ giáo viên đang dùng, quản trị chỉnh sửa được và mọi thay đổi ghi nhật ký kèm người thực hiện.
- Đổi/gán giáo viên phụ trách ngay trên bảng lớp (dropdown danh sách giáo viên).
- Mở nhanh học bạ tổng hợp của học viên từ danh sách lớp.

### 3. Lịch dạy toàn trung tâm
Trang lịch tuần cấp quản trị: xem tất cả buổi của mọi lớp, lọc theo giáo viên/phòng, tô đỏ buổi trùng phòng hoặc trùng giáo viên, bấm vào buổi để mở điểm danh.

### 4. Điều hướng & phân quyền
- Thêm mục "Giám sát lớp học" và "Lịch trung tâm" vào menu Đào tạo trong Admin, hiển thị theo quyền `training.manage`.
- Thêm liên kết chéo: từ Admin sang cổng `/giang-day` và ngược lại cho tài khoản giáo vụ.
- Quyền: `admin`, `training_manager`, `training_staff` xem/sửa toàn hệ thống; `teacher` vẫn chỉ thấy lớp của mình.

## Chi tiết kỹ thuật

- `src/lib/training/oversight.impl.ts` + `oversight.functions.ts` (thin wrapper `createServerFn` + `requireSupabaseAuth`, dùng `supabaseAdmin` nạp trong handler): `getTrainingOversight` (tổng hợp lớp + buổi + điểm danh + điểm, tính % chuyên cần và buổi thiếu điểm danh), `getTeacherWorkload`, `assignClassTeacher`. Tất cả gọi lại `isStaff()` trong `teaching.impl.ts` để chặn giáo viên thường.
- Route mới: `src/routes/_authenticated/admin.training.oversight.tsx` và `admin.training.schedule.tsx`; dùng lại `getSchedule` sẵn có với `mine: false`.
- Dùng lại `qr-attendance-panel.tsx`, `student-transcript.tsx` và logic điểm danh trong `portal.impl.ts` (đã hỗ trợ `training_manager`) để quản trị thao tác giống giáo viên, ghi `attendance_change_log` với `recorded_by` là tài khoản quản trị.
- Xuất Excel dùng `xlsx` như báo cáo lớp hiện có.
