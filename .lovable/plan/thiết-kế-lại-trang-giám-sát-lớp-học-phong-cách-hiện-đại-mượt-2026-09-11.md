# Thiết kế lại trang Giám sát lớp học — phong cách hiện đại, mượt mà, giữ nguyên màu KAIZEN

## Ràng buộc bắt buộc

- **Giữ nguyên 100% màu sắc nhận diện thương hiệu KAIZEN**: đỏ `#C92026` (primary), xanh `#3F7D3A` (secondary), nền trắng/xám sáng đang dùng trong `src/styles.css`. Không đổi, không thêm bảng màu mới.
- **Không đổi nghiệp vụ/dữ liệu**: giữ nguyên hai thẻ Giám sát lớp + Lịch trung tâm, 6 KPI, cảnh báo, bảng giáo viên, bộ lọc, bảng lớp, gán giáo viên, xuất Excel và mọi liên kết thao tác.
- **Không đổi thanh menu trái**.
- Animation nhẹ ≤300ms, tôn trọng `prefers-reduced-motion`.

## Bố cục mới (bento-grid bất đối xứng)

```text
┌──────────────────────────────────────────────────────────┐
│ Tiêu đề + cập nhật              [Cổng giảng dạy] [Excel] │
│ [ Giám sát lớp | Lịch trung tâm ]  (thẻ dạng viên thuốc) │
├──────────────────────────────────────────────────────────┤
│ 6 thẻ KPI: icon chip 3D màu, số lớn Space Grotesk,       │
│ thanh tiến độ mảnh, hover nhấc nhẹ                        │
├────────────────────────────────────┬─────────────────────┤
│ Trung tâm xử lý (cảnh báo, card    │ BỘ LỌC THÔNG MINH    │
│ nổi bật viền đỏ/xanh, nhóm theo    │ tìm kiếm + chip lọc  │
│ loại: chưa điểm danh / chưa có GV  │ nhanh trạng thái     │
│ / sắp kết thúc)                    │ (đếm số lượng)       │
├────────────────────────────────────┴─────────────────────┤
│ Tổng quan giáo viên: chuyển từ bảng → thẻ giáo viên      │
│ (avatar chữ cái, số lớp/HV, mini thanh chuyên cần,       │
│ nút "Lọc lớp") — rê chuột nâng thẻ + viền sáng           │
├──────────────────────────────────────────────────────────┤
│ Danh sách lớp: bảng dày → hàng thoáng hơn, thanh tiến    │
│ độ buổi học (20/24), chuyên cần hiển thị vòng tròn nhỏ   │
│ theo màu ngưỡng, thao tác gom vào menu "⋯", hàng hover   │
│ đổi nền êm                                                  │
└──────────────────────────────────────────────────────────┘
```

## Hiệu ứng mượt mà (thuần CSS/Tailwind, không thêm thư viện)

- Số KPI đếm mượt (count-up nhẹ) khi tải; các khối xuất hiện tuần tự (`animate-fade-in` so le 40ms).
- Thẻ KPI/giáo viên/lớp: hover `translateY(-2px)` + bóng mềm theo màu thương hiệu; nhấn giữ chìm nhẹ.
- Chuyển thẻ Giám sát/Lịch: trượt mượt 200–250ms, chỉ báo active trượt theo.
- Cảnh báo: chấm sáng nhịp rất nhẹ (pulse 2s) ở icon, không nhấp nháy chữ.
- Tiến độ buổi học/chuyên cần: thanh/vòng tròn chạy từ 0 → giá trị khi vào màn hình.
- Skeleton màn hình khi tải dữ liệu thay cho dòng "Đang tải...".

## Cấu trúc thực hiện

1. `src/routes/_authenticated/admin.training.oversight.tsx` — tách lại layout: KPI có icon chip 3D (dùng sẵn `nav-chip`/`nav-tone-*`), vùng cảnh báo nhóm theo loại, thanh lọc sticky nhẹ với chip trạng thái đếm số, bảng lớp thêm thanh tiến độ + vòng chuyên cần + menu thao tác "⋯".
2. `src/components/training/teacher-cards.tsx` (mới) — chuyển bảng "Theo giáo viên" thành lưới thẻ.
3. `src/components/training/oversight-primitives.tsx` (mới) — KpiCard, ProgressBar, AttendanceRing, CountUp, Skeleton — dùng chung, màu 100% từ token Kaizen.
4. `src/styles.css` — chỉ thêm tiện ích animation/transition (fade so le, hover nâng, skeleton shimmer), **không đụng vào biến màu hiện có**.
5. `src/lib/help/guides.ts` — cập nhật hướng dẫn trang Giám sát lớp học theo giao diện mới.

## Kiểm tra sau khi xong

- `tsgo --noEmit`, Vitest, build đều đạt.
- Playwright: màn hình 1502px và 390px — không tràn ngang; thẻ Lịch hoạt động; bộ lọc/gán GV/xuất Excel vẫn đúng; `prefers-reduced-motion` tắt hết hiệu ứng.
- So màu: mọi màu trong trang vẫn thuộc token Kaizen hiện hữu.
