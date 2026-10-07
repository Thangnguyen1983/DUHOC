# Cổng giáo viên độc lập: đúng cổng khi đăng nhập + đủ chức năng + giới hạn theo thị trường

## Hiện trạng (đã kiểm tra)

- Vai trò `teacher` đang được cấp quyền vào khu quản trị, nên đăng nhập là vào thẳng Cổng quản trị `/admin`; trang đăng nhập luôn chuyển về `/admin`.
- Cổng giáo viên `/giang-day` hiện chỉ có: tổng quan, danh sách lớp, chi tiết lớp (điểm danh/điểm số/báo cáo), lịch tuần.
- Tài liệu học tập, giám sát lớp học, bài kiểm tra, chứng chỉ hiện chỉ nằm trong khu quản trị.
- Lớp học đã có trường thị trường (`training_classes.market`), chương trình đào tạo cũng có thị trường; **hồ sơ giáo viên chưa có trường thị trường**.

## Phần 1 — Đăng nhập đúng cổng theo vai trò cao nhất

- Có vai trò quản trị/nghiệp vụ khác → vào Cổng quản trị như hiện nay.
- Chỉ có vai trò Giáo viên → vào thẳng `/giang-day`; mở địa chỉ khu quản trị sẽ tự chuyển về cổng giáo viên kèm thông báo ngắn.
- Chỉ có vai trò Học viên → vào Cổng học viên (giữ nguyên).
- Menu tài khoản: mục "Cổng quản trị" chỉ hiện với tài khoản thực sự được vào khu quản trị.

## Phần 2 — Bổ sung chức năng trong Cổng giáo viên

Thêm 4 mục vào thanh điều hướng `/giang-day` cho giáo viên và giáo vụ:

1. **Tài liệu học tập** — xem, tải, tải lên và gán tài liệu cho lớp/chương trình mình phụ trách.
2. **Giám sát lớp học** — tổng quan lớp, tiến độ, chuyên cần, cảnh báo trùng lịch.
3. **Bài kiểm tra** — tạo/sửa đề, giao bài cho lớp, xem kết quả và chấm.
4. **Chứng chỉ** — xem chứng chỉ học viên trong lớp, đề nghị/cấp theo quyền hiện có.

Dùng lại đúng dữ liệu và logic của các trang quản trị tương ứng; không tạo bảng, mã định danh hay module song song.

## Phần 3 — Giới hạn theo thị trường

- Bổ sung trường **thị trường phụ trách** (chọn nhiều) cho hồ sơ giáo viên, dùng danh mục thị trường sẵn có; admin/giáo vụ gán trong trang Giáo viên.
- Nếu chưa gán, hệ thống tự suy ra thị trường từ các lớp giáo viên đang phụ trách để không ai bị mất quyền xem đột ngột.
- Với vai trò `teacher`, mọi danh sách trong cổng giáo viên chỉ hiện dữ liệu thuộc thị trường phụ trách **và** lớp do chính mình dạy: lớp học, lịch, giám sát, tài liệu, chương trình, bài kiểm tra, chứng chỉ.
- Mở trực tiếp một lớp/tài liệu/bài kiểm tra khác thị trường sẽ bị từ chối kèm thông báo, không chỉ ẩn trên giao diện.
- Giáo vụ (`training_manager`, `training_staff`) và admin giữ phạm vi toàn hệ thống như hiện nay.
- Bộ lọc thị trường trong cổng giáo viên chỉ liệt kê thị trường được phép.

## Không thay đổi

- Không sửa bảng vai trò, không gỡ vai trò của tài khoản nào; không đổi quyền các vai trò khác.
- Các trang quản trị hiện có, điểm danh QR, điểm số, báo cáo giữ nguyên.

## Hướng dẫn và kiểm thử

- Cập nhật Hướng dẫn sử dụng: giáo viên thuần túy chỉ dùng Cổng giáo viên, danh sách chức năng mới, cách gán thị trường phụ trách.
- Kiểm thử: tài khoản chỉ `teacher` bị chuyển hướng khỏi khu quản trị; thầy Thọ (kiêm nhiệm) vẫn vào quản trị; giáo viên thị trường Đức không xem được lớp/tài liệu/bài kiểm tra thị trường Nhật kể cả khi gõ thẳng địa chỉ.

## Chi tiết kỹ thuật

- Helper mới trong `src/lib/rbac/`: xác định cổng mặc định từ vai trò; `src/routes/auth.tsx` điều hướng theo `getMyRoles`; `src/routes/_authenticated/route.tsx` chuyển hướng khi vai trò chỉ gồm `teacher`/`student`; `portal-switcher.tsx` cập nhật `canOpenAdmin`.
- Migration: thêm `teachers.markets text[] not null default '{}'` (tham chiếu mã trong `catalog_markets`), giữ nguyên RLS/grants hiện có của bảng.
- Helper `teacherScope(ctx)` trong `src/lib/training/`: trả về `{ scopeAll: boolean, markets: string[], classIds: string[] }`; mọi server function của cổng giáo viên áp bộ lọc này trước khi truy vấn và chặn truy cập chi tiết ngoài phạm vi.
- Route mới: `giang-day.tai-lieu.tsx`, `giang-day.giam-sat.tsx`, `giang-day.bai-kiem-tra.tsx` (+ `$id`), `giang-day.chung-chi.tsx`; tách UI dùng chung từ `admin.materials.tsx`, `admin.training.oversight.tsx`, `admin.quizzes.*`, `admin.certificates.tsx` sang `src/components/training/`.
- Server functions dùng lại `src/lib/training/*.functions.ts` + `src/lib/rbac/guard.ts` (`materials.*`, `training.view`, `quizzes.*`, `certificates.view`).
- Cập nhật `src/lib/help/guides.ts`; bổ sung test độ phủ RBAC và test phạm vi thị trường.
