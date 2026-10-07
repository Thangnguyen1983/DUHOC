# Thu hẹp chiều cao banner theo tỷ lệ 16:9

Mục tiêu: banner đầu trang không còn quá cao, luôn hiển thị theo khung 16:9 để bố cục cân đối hơn trên cả desktop và mobile.

## Thay đổi hiển thị

- **Chế độ "Ảnh thuần"**: ảnh đặt trong khung cố định tỷ lệ 16:9, giới hạn chiều rộng tối đa 1920px và chiều cao tối đa khoảng 620px trên desktop. Ảnh phủ kín khung (căn giữa) nên không bị méo; phần thừa trên/dưới của ảnh quá cao sẽ được cắt đều hai phía.
- **Chế độ "Chữ đè ảnh"**: giảm chiều cao tối thiểu hiện tại (380px mobile / 460px desktop) xuống khung 16:9 tương ứng, đặt trần chiều cao để không chiếm hết màn hình.
- Khối chữ (tiêu đề, mô tả, CTA) bên dưới ảnh giữ nguyên, chỉ giảm khoảng đệm dọc một chút cho gọn.

## Ghi chú cho người biên tập

- Cập nhật gợi ý kích thước ảnh trong trang quản trị Banner theo trang thành **1920×1080 (16:9)** để ảnh vừa khung, không bị xén nội dung quan trọng.

## Kỹ thuật

- `src/components/premium-hero.tsx`: bọc `<img>` bằng `div` có `aspect-[16/9] max-h-[620px] w-full overflow-hidden`, ảnh dùng `h-full w-full object-cover object-center`. Với chế độ overlay, đổi `min-h-[380px]/[460px]` sang khung `aspect-[16/9]` kèm `min-h`/`max-h` an toàn cho nội dung dài.
- `src/components/page-hero.tsx`: đồng bộ chiều cao tương tự để các trang dùng hero cũ không lệch.
- `src/routes/_authenticated/admin.page-banners.tsx`: sửa dòng hướng dẫn kích thước ảnh.
