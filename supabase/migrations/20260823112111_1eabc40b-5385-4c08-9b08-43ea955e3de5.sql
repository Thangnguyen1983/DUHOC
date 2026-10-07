-- Gộp loại "Bài viết / Tin tức" (blog) vào loại "Bài viết" (post) và ẩn các loại trùng/không dùng
UPDATE public.cms_entries
SET content_type_id = (SELECT id FROM public.cms_content_types WHERE slug = 'post')
WHERE content_type_id = (SELECT id FROM public.cms_content_types WHERE slug = 'blog');

UPDATE public.cms_content_types SET is_active = false WHERE slug = 'blog';

UPDATE public.cms_content_types
SET name = 'Bài viết / Tin tức', description = 'Bài viết, tin tức, cẩm nang, hỏi đáp — gắn theo Module + Thị trường', sort_order = 10
WHERE slug = 'post';

UPDATE public.cms_content_types SET sort_order = 20 WHERE slug = 'success_story';
UPDATE public.cms_content_types SET sort_order = 30 WHERE slug = 'school';
UPDATE public.cms_content_types SET sort_order = 40 WHERE slug = 'market_hub';
UPDATE public.cms_content_types SET sort_order = 50 WHERE slug = 'market_landing';
UPDATE public.cms_content_types
SET name = 'Trang thị trường (Landing)', description = 'Nội dung landing 1 quốc gia: /du-hoc/<quốc gia>'
WHERE slug = 'market_landing';
UPDATE public.cms_content_types
SET description = 'Cấu hình portal 1 thị trường: hero, ngành nghề, chi phí, quy trình, FAQ'
WHERE slug = 'market_hub';