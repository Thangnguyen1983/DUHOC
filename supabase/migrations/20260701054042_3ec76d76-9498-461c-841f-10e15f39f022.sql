
-- Phase C: CMS content type for homepage sections (hero, USP, CTA)
INSERT INTO public.cms_content_types (slug, name, description, icon, template, is_singleton, is_active, sort_order, field_schema)
VALUES (
  'homepage_section',
  'Section trang chủ',
  'Nội dung các khối Hero / USP / CTA trên trang chủ (mỗi entry là một khối, slug cố định: hero, usp, cta).',
  'layout',
  'homepage_section',
  false,
  true,
  0,
  '{"fields":[{"key":"data","type":"json","label":"Dữ liệu khối (JSON)","help":"Xem cấu trúc mặc định trong tài liệu"}]}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Seed 3 entries with default content matching current homepage
WITH ct AS (SELECT id FROM public.cms_content_types WHERE slug='homepage_section')
INSERT INTO public.cms_entries (content_type_id, slug, title, status, published_at, data)
SELECT ct.id, v.slug, v.title, 'published', now(), v.data::jsonb
FROM ct, (VALUES
  ('hero', 'Hero trang chủ',
   '{"eyebrow":"Vững bước tương lai — Vươn tầm thế giới","headline_prefix":"Kaizen","headline_suffix":" – Kết nối nhân tài Việt Nam với cơ hội toàn cầu","subheadline":"Hơn 15 năm phát triển trong lĩnh vực Du học Quốc tế, Nhân lực Quốc tế và Đào tạo Ngoại ngữ.","primary_cta":{"label":"Đăng ký tư vấn","to":"/dang-ky"},"secondary_cta":{"label":"Khám phá chương trình","to":"/du-hoc"},"stats":[{"value":"15+","label":"Năm kinh nghiệm"},{"value":"20K+","label":"Học viên thành công"},{"value":"50+","label":"Đối tác toàn cầu"}]}'
  ),
  ('usp', 'USP – 3 trụ cột niềm tin',
   '{"pillars":[{"icon":"ShieldCheck","title":"Minh bạch & Pháp lý","desc":"Hợp đồng chuẩn hóa, chi phí công khai, đầy đủ giấy phép hoạt động du học và XKLĐ."},{"icon":"FileCheck","title":"Tỷ lệ thành công cao","desc":"Hồ sơ được lọc kỹ, đào tạo bài bản và đối tác uy tín tại 20+ quốc gia trên thế giới."},{"icon":"Headphones","title":"Đồng hành 360°","desc":"Tư vấn — đào tạo — phỏng vấn — xuất cảnh — hỗ trợ sau khi đến nước sở tại."}]}'
  ),
  ('cta', 'CTA đăng ký tư vấn',
   '{"eyebrow":"Bắt đầu ngay","headline":"Sẵn sàng bắt đầu hành trình của bạn?","description":"Để lại thông tin — chuyên viên Kaizen sẽ gọi tư vấn miễn phí trong 24h, giúp bạn chọn đúng thị trường và chương trình phù hợp nhất.","show_hotline":true}'
  )
) AS v(slug, title, data)
ON CONFLICT DO NOTHING;
