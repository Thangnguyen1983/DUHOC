ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS markets text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.teachers.markets IS 'Danh sách mã thị trường (catalog_markets.code) mà giáo viên phụ trách. Rỗng = suy ra từ lớp đang dạy.';

CREATE INDEX IF NOT EXISTS teachers_markets_idx ON public.teachers USING gin (markets);