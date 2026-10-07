INSERT INTO public.cms_tags (slug, name) VALUES
  ('duc', 'Du học Đức'),
  ('dai-loan', 'Du học Đài Loan'),
  ('han-quoc', 'Du học Hàn Quốc'),
  ('nhat-ban', 'Du học Nhật Bản'),
  ('chau-au', 'Du học Châu Âu'),
  ('canada', 'Du học Canada')
ON CONFLICT (slug) DO NOTHING;