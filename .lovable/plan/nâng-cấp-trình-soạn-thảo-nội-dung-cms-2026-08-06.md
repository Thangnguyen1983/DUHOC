# Nâng cấp trình soạn thảo nội dung CMS

Mục tiêu: ô "Nội dung (HTML/Markdown)" cho phép chèn **nhiều ảnh** ở bất kỳ đoạn nào, **chèn video**, **chèn icon/emoji**, và **tô đậm/định dạng chữ tiếng Việt** đúng dấu.

## Chức năng mới (thanh công cụ trên ô nội dung)

- **Chèn ảnh (nhiều ảnh)**: mở thư viện ảnh hiện có, cho phép chọn nhiều ảnh một lần; mỗi ảnh chèn tại đúng vị trí con trỏ dưới dạng `<figure>` có `alt`, `loading="lazy"`, chú thích tùy chọn. Có thêm nút "Chèn dải ảnh" (2–3 ảnh cạnh nhau).
- **Chèn video**: dán link YouTube/Vimeo → tự chuyển thành khối nhúng responsive (16:9, `title`, `loading="lazy"`). Hỗ trợ cả link `youtu.be`, `watch?v=`, `/embed/`.
- **Chèn icon**: bảng chọn icon/emoji theo nhóm (học tập, quốc gia, liên hệ, đánh dấu ✅ ⚠️ 📌…), chèn tại con trỏ.
- **Định dạng chữ**: nút **B**, *I*, gạch chân, H2/H3, danh sách chấm/số, trích dẫn, liên kết, kẻ ngang. Bọc đúng phần văn bản đang bôi đen, giữ nguyên dấu tiếng Việt (thao tác trên chuỗi Unicode, không đụng bộ gõ).
- Phím tắt: Ctrl/Cmd+B, +I, +K (liên kết).

## Xem trước

Thêm tab "Xem trước" ngay cạnh ô soạn thảo, render nội dung đúng như trang bài viết (kèm làm sạch HTML bằng thư viện lọc đã có trong dự án).

## Kỹ thuật

- Giữ nguyên định dạng lưu trữ hiện tại (HTML/Markdown trong `data.body`) — không đổi schema, không đổi `upsertEntry`.
- Tạo `src/components/cms/content-toolbar.tsx`: thao tác chèn/bọc văn bản trên `<textarea>` qua `selectionStart/selectionEnd`, giữ vị trí con trỏ sau khi chèn.
- Tạo `src/components/cms/icon-picker.tsx` và `src/components/cms/embed-video-dialog.tsx`.
- Mở rộng `MediaPicker` thêm chế độ chọn nhiều ảnh (`multiple`), trả về mảng ảnh; giữ nguyên hành vi cũ cho các nơi đang dùng.
- Thay khối chèn ảnh hiện tại trong `src/components/cms/entry-form.tsx` bằng thanh công cụ mới; bỏ dòng ghi chú "Pha 2 sẽ thay bằng Rich Text Editor".
- Xem trước dùng `marked` + `isomorphic-dompurify` (đã có sẵn), cho phép `iframe` YouTube/Vimeo, `figure`, `figcaption`.
- Không dùng thư viện soạn thảo mới (không cài TipTap) để tránh xung đột với luồng chuẩn hóa Markdown và AI Writer đang chạy.

## Kiểm chứng

Chụp màn hình trang `/admin/cms/post/new` và thử: chèn 3 ảnh vào 3 đoạn khác nhau, nhúng 1 video YouTube, chèn icon, bôi đen chữ có dấu rồi tô đậm — kiểm tra tab Xem trước hiển thị đúng.
