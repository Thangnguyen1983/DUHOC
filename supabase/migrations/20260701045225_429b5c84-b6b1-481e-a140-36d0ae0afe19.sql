
-- Bổ sung roles mới
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'seo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'marketing';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'contributor';
