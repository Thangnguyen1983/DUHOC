WITH blog_type AS (SELECT id FROM public.cms_content_types WHERE slug='blog'),
tag_map(slug, patterns) AS (VALUES
  ('duc',       ARRAY['duc','duc-','-duc','germany','german','ausbildung']),
  ('dai-loan',  ARRAY['dai-loan','taiwan']),
  ('han-quoc',  ARRAY['han-quoc','korea','han-']),
  ('nhat-ban',  ARRAY['nhat-ban','japan','nhat-']),
  ('chau-au',   ARRAY['chau-au','europe','eu-']),
  ('canada',    ARRAY['canada'])
)
INSERT INTO public.cms_entry_tags (entry_id, tag_id)
SELECT e.id, t.id
FROM public.cms_entries e
JOIN blog_type bt ON bt.id = e.content_type_id
CROSS JOIN tag_map tm
JOIN public.cms_tags t ON t.slug = tm.slug
WHERE e.deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM unnest(tm.patterns) p
    WHERE lower(e.slug) LIKE '%'||p||'%'
       OR lower(e.title) LIKE '%'||replace(p,'-',' ')||'%'
  )
ON CONFLICT DO NOTHING;