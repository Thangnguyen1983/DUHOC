ALTER TABLE public.page_banners
  ADD COLUMN IF NOT EXISTS layout text NOT NULL DEFAULT 'overlay';

ALTER TABLE public.page_banners
  DROP CONSTRAINT IF EXISTS page_banners_layout_check;

ALTER TABLE public.page_banners
  ADD CONSTRAINT page_banners_layout_check CHECK (layout IN ('overlay','image'));