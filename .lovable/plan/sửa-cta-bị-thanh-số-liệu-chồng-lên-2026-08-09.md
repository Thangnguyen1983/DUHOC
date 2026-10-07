# Sửa CTA bị thanh số liệu chồng lên

## Nguyên nhân
Các trang du học/thị trường có một khối "số liệu nhanh" (học phí, sinh hoạt phí…) được kéo ngược lên bằng `-mt-8 md:-mt-12` để tạo hiệu ứng "đè lên banner". Khi banner chuyển sang chế độ Ảnh thuần, phần tiêu đề + nút CTA nằm ở khối chữ nền trắng bên dưới ảnh, nên khối số liệu kéo lên đúng vào vị trí hai nút CTA → CTA bị che một nửa (đúng như ảnh chụp).

Các file đang dùng kiểu kéo lên này: `du-hoc.han-quoc.index.tsx`, `du-hoc.duc.tsx`, `du-hoc.dai-loan.tsx`, `du-hoc.$country.tsx`, `components/cms/market-landing-template.tsx`.

## Phương án bố trí lại (2 cột, tận dụng khoảng trắng bên phải)
Khối chữ dưới banner hiện chỉ chiếm nửa trái, nửa phải bỏ trống. Bố trí lại thành lưới 2 cột trên desktop:

```text
[ chip DU HỌC CÙNG KAIZEN        ]   [                      ]
[ H1 Du học Canada               ]   [  Nút: Xem chương trình ]
[ mô tả 2–4 dòng                 ]   [  Nút: Đăng ký tư vấn   ]
[                                ]   [  dòng tin cậy nhỏ      ]
--------------------------------------------------------------
[ thanh 4 số liệu: học phí | sinh hoạt | GIC | thu nhập       ]
```

1. Desktop (từ `md`): trái = chip + H1 + mô tả (tối đa ~60ch); phải = cụm CTA xếp dọc, căn phải, kèm một dòng phụ nhỏ ("Tư vấn miễn phí 1-1 · Phản hồi trong 24h"). Không còn vùng trắng lớn.
2. Mobile/tablet: về lại một cột, CTA nằm dưới mô tả, nút full-width để dễ bấm.
3. Bỏ hiệu ứng kéo lên `-mt-8 md:-mt-12` của thanh số liệu (thủ phạm che CTA), thay bằng khoảng cách dương và đường phân tách nhẹ giữa khối chữ và thanh số liệu.
4. Thanh số liệu giữ nguyên kiểu thẻ 4 cột (2 cột tablet, 1 cột mobile), thống nhất cho tất cả trang.
5. Tránh trùng lặp: nếu banner CMS đã cấu hình số liệu thì trang không render thêm khối số liệu cứng.

## Kỹ thuật
- `src/components/premium-hero.tsx` (chế độ Ảnh thuần): khối dưới ảnh đổi sang `grid md:grid-cols-[minmax(0,1fr)_auto] items-end gap-6`, CTA nằm cột phải (`md:justify-self-end`, `flex-col`), mobile `w-full`. Thanh số liệu dùng margin dương.
- Bỏ/điều chỉnh `relative -mt-8 md:-mt-12` tại: `du-hoc.han-quoc.index.tsx`, `du-hoc.duc.tsx`, `du-hoc.dai-loan.tsx`, `du-hoc.$country.tsx`, `components/cms/market-landing-template.tsx` (và `-mt-16/-mt-20` ở `xkld.$country.tsx` chỉ giữ khi hero là chế độ chữ đè ảnh).
- Áp `min-w-0` cho cột chữ để tiêu đề dài không tràn ngang.
- Kiểm tra ảnh chụp ở 360px / 768px / 1280px cho Canada, Hàn Quốc, Đức, Đài Loan.

Không đổi nội dung, chỉ chỉnh bố cục và khoảng cách.

