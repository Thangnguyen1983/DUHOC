# Thiết kế lại "Tiến trình 18 bước" trong Hồ sơ học viên thành timeline ngang dạng icon

## Mini-PRD
1. Mục tiêu: học viên mở "Hồ sơ của tôi" nhìn một cái là biết mình đang ở bước nào trong hành trình 18 bước, đã qua bước nào, còn bước nào.
2. Đối tượng: học viên đăng nhập cổng `/hoc-vien` (chủ yếu xem trên điện thoại).
3. CTA chính: không có — đây là khu vực theo dõi trạng thái; giữ liên kết hiện có.
4. Nội dung chính: timeline ngang 18 mốc, mỗi mốc là 1 icon + nhãn ngắn; bước hiện tại nổi bật (màu đỏ Kaizen + vòng sáng), bước đã qua màu xanh lá, bước chưa tới xám nhạt.
5. SEO: không áp dụng (trang sau đăng nhập, noindex sẵn có).
6. Success metric: không cần cuộn dọc danh sách 18 dòng; trên mobile vuốt ngang mượt, không vỡ layout ở 360px.
7. Edge case: bước kết thúc đặc biệt ("Tạm dừng", "Đã huỷ") hiển thị màu cảnh báo/đỏ thay vì xanh; chưa có workflow thì ẩn block như hiện tại; tên bước dài vẫn đọc được (nhãn 2 dòng, tooltip khi chạm).
8. Rollback: đổi lại component block "Tiến trình" trong `hoc-vien.ho-so.tsx` — không đụng dữ liệu.

## Phạm vi

Chỉ sửa **1 file**: `src/routes/hoc-vien.ho-so.tsx`, thay danh sách dọc `<ol>` hiện tại bằng **timeline ngang responsive**.

### Thiết kế mới

```text
Desktop (≥lg): 18 mốc chia 2 hàng lưới 9 cột, nối nhau bằng đường kẻ
 [1]─[2]─[3]─...─[9]
                  │
 [18]─[17]─...─[10]   (hàng 2 bẻ ngược, ziczac)

Mobile (<lg): thanh cuộn ngang (scroll-x, snap)
 [1]─[2]─[3]─[4]→  vuốt để xem tiếp
```

Mỗi mốc gồm:
- **Icon tròn** (lucide) đại diện nhóm bước: Lead/tư vấn → `PhoneCall`, hồ sơ → `FileText`, hợp đồng → `PenLine`, lớp/đào tạo → `GraduationCap`, thi → `ClipboardCheck`, visa → `Plane`, xuất cảnh → `PlaneTakeoff`, CSKH → `HeartHandshake`, hoàn thành → `BadgeCheck`, tạm dừng → `PauseCircle`, huỷ → `XCircle`.
- **Số thứ tự** nhỏ ở góc icon.
- **Nhãn bước** dưới icon, tối đa 2 dòng, cỡ chữ xs.

Trạng thái màu (theo token hệ thống, không hardcode hex):
- Đã qua: nền xanh lá (`bg-emerald-500/15`, icon `text-emerald-600`), đường nối xanh.
- Hiện tại: nền `bg-primary`, icon trắng, vòng `ring` sáng + nhãn đậm màu primary, có ghi chú "Bạn đang ở đây".
- Chưa tới: `bg-muted`, `text-muted-foreground`, đường nối xám đứt nét.

Kèm theo ở đầu block:
- Thanh **% tiến trình** (bước hiện tại / 18) dùng component `Progress` sẵn có.
- Dòng tóm tắt: "Bước 7/18 — Đang đào tạo".

### Quy tắc UI (theo chuẩn Kaizen)
- Tap target icon ≥ 44px; cuộn ngang mượt (`snap-x`, ẩn scrollbar).
- Màu dùng token semantic (`primary`, `muted`, `emerald` nhịp sẵn có) — không hardcode `bg-white`/`text-black`.
- Nhãn tiếng Việt đầy đủ dấu, font Be Vietnam Pro sẵn có.

## Ghi chú kỹ thuật

- Dữ liệu sẵn có: `data.workflow.workflow_definitions.steps` (mảng `{key,label}`) và `current_step` — không đổi backend, không tạo bảng.
- Icon map đặt trong cùng file route (hoặc tách `src/lib/help/step-icons.ts` nếu muốn tái dùng ở trang admin workflow).
- Kiểm tra ở viewport 360px: không scroll ngang toàn trang, chỉ cuộn trong khung timeline.

## Bước tiếp theo
Duyệt kế hoạch để tôi triển khai ngay.
