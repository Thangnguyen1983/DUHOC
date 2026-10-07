UPDATE public.cms_content_types
SET is_active = false
WHERE slug IN (
  'case_study','faq','guide','library_item','news','policy',
  'popup','promotion','project','service','static_page','landing'
);