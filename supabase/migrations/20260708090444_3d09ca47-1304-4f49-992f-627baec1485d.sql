UPDATE public.cms_entries
SET data = jsonb_set(
  data,
  '{body}',
  to_jsonb('## KHAI GIẢNG LỚP TIẾNG ĐỨC K62

🗓 Thời gian: 09:00, Thứ Tư ngày 22/07/2026

🎯 Trình độ đào tạo: A1 – A2 – B1
### Vì sao nên học tại Kaizen?

- Lộ trình học bài bản, rõ ràng từ cơ bản đến nâng cao
- Giáo trình chuẩn quốc tế, cập nhật mới nhất
- Đội ngũ giáo viên giàu kinh nghiệm, tận tâm
- Cam kết đồng hành và hỗ trợ học viên trong suốt quá trình học
- Môi trường học tập năng động, giúp phát triển toàn diện kỹ năng nghe – nói – đọc – viết

- 🌍 Tiếng Đức không chỉ là một ngoại ngữ mà còn là tấm vé mở ra cơ hội học tập, nghề nghiệp và tương lai tại CHLB Đức.
- 🔥 Đăng ký ngay hôm nay để giữ chỗ và nhận tư vấn lộ trình phù hợp!
- 📍 Trung tâm Ngoại ngữ Quốc tế Kaizen
- 📞 Hotline: 0979 160 999'::text),
  true
),
updated_at = now()
WHERE id = 'a0e1f821-7cb3-4c2c-811f-7856fa7475ab';