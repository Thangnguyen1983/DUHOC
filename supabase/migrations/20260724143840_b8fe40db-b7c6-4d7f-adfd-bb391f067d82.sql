
DO $$ BEGIN CREATE TYPE public.course_lesson_type AS ENUM ('video','text','quiz','assignment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.course_video_provider AS ENUM ('youtube','vimeo','bunny','upload');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.course_order_status AS ENUM ('pending','paid','cancelled','refunded','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.course_payment_provider AS ENUM ('pay2s','momo','zalopay','manual','free');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.course_level AS ENUM ('beginner','elementary','intermediate','upper','advanced','all');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS is_online_instructor boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bio_long text,
  ADD COLUMN IF NOT EXISTS expertise text[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  description text,
  cover_url text,
  trailer_provider public.course_video_provider,
  trailer_video_id text,
  language text NOT NULL DEFAULT 'vi',
  level public.course_level NOT NULL DEFAULT 'all',
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  price_vnd integer NOT NULL DEFAULT 0,
  sale_price_vnd integer,
  is_free boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  instructor_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  requirements text[] NOT NULL DEFAULT '{}',
  outcomes text[] NOT NULL DEFAULT '{}',
  target_audience text[] NOT NULL DEFAULT '{}',
  total_lessons integer NOT NULL DEFAULT 0,
  total_minutes integer NOT NULL DEFAULT 0,
  rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  students_count integer NOT NULL DEFAULT 0,
  seo jsonb NOT NULL DEFAULT '{}'::jsonb,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
GRANT SELECT ON public.courses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY courses_public_read ON public.courses FOR SELECT USING (is_published = true);
CREATE POLICY courses_admin_all ON public.courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'course_instructor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'course_instructor'));
CREATE POLICY courses_sales_read ON public.courses FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'sales'));
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_course_modules_course ON public.course_modules(course_id, order_index);
GRANT SELECT ON public.course_modules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_modules TO authenticated;
GRANT ALL ON public.course_modules TO service_role;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY course_modules_public_read ON public.course_modules FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.is_published = true));
CREATE POLICY course_modules_admin_all ON public.course_modules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'course_instructor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'course_instructor'));
CREATE TRIGGER trg_course_modules_updated BEFORE UPDATE ON public.course_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'purchase',
  price_paid_vnd integer NOT NULL DEFAULT 0,
  order_id uuid,
  expires_at timestamptz,
  progress_percent numeric(5,2) NOT NULL DEFAULT 0,
  completed_at timestamptz,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user ON public.course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON public.course_enrollments(course_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_enrollments TO authenticated;
GRANT ALL ON public.course_enrollments TO service_role;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY course_enrollments_own_read ON public.course_enrollments FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY course_enrollments_admin_all ON public.course_enrollments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'course_instructor') OR public.has_role(auth.uid(),'sales'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'course_instructor') OR public.has_role(auth.uid(),'sales'));
CREATE TRIGGER trg_course_enrollments_updated BEFORE UPDATE ON public.course_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  type public.course_lesson_type NOT NULL DEFAULT 'video',
  video_provider public.course_video_provider,
  video_id text,
  video_url text,
  content_md text,
  duration_seconds integer NOT NULL DEFAULT 0,
  is_preview boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  quiz_id uuid,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module ON public.course_lessons(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course ON public.course_lessons(course_id);
GRANT SELECT ON public.course_lessons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_lessons TO authenticated;
GRANT ALL ON public.course_lessons TO service_role;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY course_lessons_preview_read ON public.course_lessons FOR SELECT
  USING (is_preview = true AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.is_published = true));
CREATE POLICY course_lessons_enrolled_read ON public.course_lessons FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.course_enrollments e
    WHERE e.course_id = course_lessons.course_id
      AND e.user_id = auth.uid()
      AND (e.expires_at IS NULL OR e.expires_at > now())
  ));
CREATE POLICY course_lessons_admin_all ON public.course_lessons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'course_instructor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'course_instructor'));
CREATE TRIGGER trg_course_lessons_updated BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.course_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  watched_seconds integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  last_position integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_course ON public.course_lesson_progress(user_id, course_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_lesson_progress TO authenticated;
GRANT ALL ON public.course_lesson_progress TO service_role;
ALTER TABLE public.course_lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY lesson_progress_own_all ON public.course_lesson_progress FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY lesson_progress_admin_read ON public.course_lesson_progress FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'course_instructor'));
CREATE TRIGGER trg_lesson_progress_updated BEFORE UPDATE ON public.course_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.course_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_course_reviews_course ON public.course_reviews(course_id);
GRANT SELECT ON public.course_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_reviews TO authenticated;
GRANT ALL ON public.course_reviews TO service_role;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY course_reviews_public_read ON public.course_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY course_reviews_own_all ON public.course_reviews FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY course_reviews_admin_all ON public.course_reviews FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'course_instructor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'course_instructor'));
CREATE TRIGGER trg_course_reviews_updated BEFORE UPDATE ON public.course_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.course_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','fixed')),
  value integer NOT NULL,
  max_uses integer,
  uses integer NOT NULL DEFAULT 0,
  valid_from timestamptz,
  valid_to timestamptz,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_coupons TO authenticated;
GRANT ALL ON public.course_coupons TO service_role;
ALTER TABLE public.course_coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY course_coupons_admin_all ON public.course_coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sales'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sales'));
CREATE TRIGGER trg_course_coupons_updated BEFORE UPDATE ON public.course_coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.course_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email text,
  customer_name text,
  customer_phone text,
  subtotal_vnd integer NOT NULL DEFAULT 0,
  discount_vnd integer NOT NULL DEFAULT 0,
  total_vnd integer NOT NULL DEFAULT 0,
  status public.course_order_status NOT NULL DEFAULT 'pending',
  payment_provider public.course_payment_provider NOT NULL DEFAULT 'manual',
  payment_ref text,
  payment_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  coupon_id uuid REFERENCES public.course_coupons(id) ON DELETE SET NULL,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_course_orders_user ON public.course_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_course_orders_status ON public.course_orders(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_orders TO authenticated;
GRANT ALL ON public.course_orders TO service_role;
ALTER TABLE public.course_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY course_orders_own_read ON public.course_orders FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY course_orders_own_insert ON public.course_orders FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY course_orders_admin_all ON public.course_orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sales'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sales'));
CREATE TRIGGER trg_course_orders_updated BEFORE UPDATE ON public.course_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.course_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.course_orders(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  title_snapshot text NOT NULL,
  price_vnd integer NOT NULL,
  qty integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_course_order_items_order ON public.course_order_items(order_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_order_items TO authenticated;
GRANT ALL ON public.course_order_items TO service_role;
ALTER TABLE public.course_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY course_order_items_own_read ON public.course_order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.course_orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY course_order_items_admin_all ON public.course_order_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sales'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sales'));

CREATE TABLE IF NOT EXISTS public.course_qa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.course_qa(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_instructor_answer boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_course_qa_lesson ON public.course_qa(lesson_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_qa TO authenticated;
GRANT ALL ON public.course_qa TO service_role;
ALTER TABLE public.course_qa ENABLE ROW LEVEL SECURITY;
CREATE POLICY course_qa_enrolled_read ON public.course_qa FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.course_enrollments e WHERE e.course_id = course_qa.course_id AND e.user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'course_instructor')
  );
CREATE POLICY course_qa_enrolled_insert ON public.course_qa FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (EXISTS (SELECT 1 FROM public.course_enrollments e WHERE e.course_id = course_qa.course_id AND e.user_id = auth.uid())
     OR public.has_role(auth.uid(),'admin')
     OR public.has_role(auth.uid(),'course_instructor'))
  );
CREATE POLICY course_qa_own_update ON public.course_qa FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'course_instructor'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'course_instructor'));
CREATE POLICY course_qa_own_delete ON public.course_qa FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_course_qa_updated BEFORE UPDATE ON public.course_qa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
