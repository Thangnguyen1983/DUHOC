
DO $$ BEGIN CREATE TYPE public.lesson_status AS ENUM ('draft','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.quiz_status AS ENUM ('draft','published','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.quiz_question_type AS ENUM ('single_choice','multiple_choice','true_false','short_answer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.quiz_attempt_status AS ENUM ('in_progress','submitted','graded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.certificate_status AS ENUM ('issued','revoked','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL, email text, phone text,
  specialization text, bio text, avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_teachers_user ON public.teachers(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teachers TO authenticated;
GRANT ALL ON public.teachers TO service_role;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teachers_admin_all" ON public.teachers FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff'));
CREATE POLICY "teachers_self_view" ON public.teachers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "teachers_authenticated_view" ON public.teachers FOR SELECT TO authenticated USING (is_active = true);
CREATE TRIGGER trg_teachers_updated BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DO $$ BEGIN ALTER TABLE public.training_classes ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.training_programs(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.training_classes(id) ON DELETE CASCADE,
  title text NOT NULL, description text, content text, video_url text,
  duration_minutes integer, order_index integer NOT NULL DEFAULT 0,
  status public.lesson_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lessons_program ON public.lessons(program_id);
CREATE INDEX IF NOT EXISTS idx_lessons_class ON public.lessons(class_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons_admin_all" ON public.lessons FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff'));
CREATE POLICY "lessons_enrolled_view" ON public.lessons FOR SELECT TO authenticated
USING (status = 'published' AND (
  EXISTS (SELECT 1 FROM public.training_enrollments te JOIN public.student_profiles sp ON sp.id = te.student_profile_id
    WHERE sp.user_id = auth.uid() AND (te.class_id = lessons.class_id OR
    EXISTS (SELECT 1 FROM public.training_classes tc WHERE tc.id = te.class_id AND tc.program_id = lessons.program_id)))
  OR EXISTS (SELECT 1 FROM public.training_classes tc JOIN public.teachers t ON t.id = tc.teacher_id
    WHERE t.user_id = auth.uid() AND (tc.id = lessons.class_id OR tc.program_id = lessons.program_id))
));
CREATE TRIGGER trg_lessons_updated BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.lesson_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  file_name text NOT NULL, file_path text NOT NULL,
  file_type text, file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lesson_att_lesson ON public.lesson_attachments(lesson_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_attachments TO authenticated;
GRANT ALL ON public.lesson_attachments TO service_role;
ALTER TABLE public.lesson_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lesson_att_admin_all" ON public.lesson_attachments FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff'));
CREATE POLICY "lesson_att_view" ON public.lesson_attachments FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.lessons l WHERE l.id = lesson_attachments.lesson_id));

CREATE TABLE IF NOT EXISTS public.learning_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.training_programs(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.training_classes(id) ON DELETE CASCADE,
  title text NOT NULL, description text, category text,
  file_name text, file_path text, file_type text, file_size bigint,
  is_public boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lm_program ON public.learning_materials(program_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_materials TO authenticated;
GRANT ALL ON public.learning_materials TO service_role;
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lm_admin_all" ON public.learning_materials FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff'));
CREATE POLICY "lm_enrolled_view" ON public.learning_materials FOR SELECT TO authenticated
USING (is_public = true OR
  EXISTS (SELECT 1 FROM public.training_enrollments te JOIN public.student_profiles sp ON sp.id = te.student_profile_id
    WHERE sp.user_id = auth.uid() AND (te.class_id = learning_materials.class_id OR
    EXISTS (SELECT 1 FROM public.training_classes tc WHERE tc.id = te.class_id AND tc.program_id = learning_materials.program_id)))
  OR EXISTS (SELECT 1 FROM public.training_classes tc JOIN public.teachers t ON t.id = tc.teacher_id
    WHERE t.user_id = auth.uid() AND (tc.id = learning_materials.class_id OR tc.program_id = learning_materials.program_id))
);
CREATE TRIGGER trg_lm_updated BEFORE UPDATE ON public.learning_materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES public.training_programs(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.training_classes(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  title text NOT NULL, description text,
  time_limit_minutes integer, passing_score numeric NOT NULL DEFAULT 50,
  max_attempts integer NOT NULL DEFAULT 1, shuffle_questions boolean NOT NULL DEFAULT false,
  status public.quiz_status NOT NULL DEFAULT 'draft',
  starts_at timestamptz, ends_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quizzes_admin_all" ON public.quizzes FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff'));
CREATE POLICY "quizzes_enrolled_view" ON public.quizzes FOR SELECT TO authenticated
USING (status = 'published' AND (
  EXISTS (SELECT 1 FROM public.training_enrollments te JOIN public.student_profiles sp ON sp.id = te.student_profile_id
    WHERE sp.user_id = auth.uid() AND (te.class_id = quizzes.class_id OR
    EXISTS (SELECT 1 FROM public.training_classes tc WHERE tc.id = te.class_id AND tc.program_id = quizzes.program_id)))
  OR EXISTS (SELECT 1 FROM public.training_classes tc JOIN public.teachers t ON t.id = tc.teacher_id
    WHERE t.user_id = auth.uid() AND (tc.id = quizzes.class_id OR tc.program_id = quizzes.program_id))
));
CREATE TRIGGER trg_quizzes_updated BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type public.quiz_question_type NOT NULL DEFAULT 'single_choice',
  points numeric NOT NULL DEFAULT 1, order_index integer NOT NULL DEFAULT 0,
  explanation text, correct_answer_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qq_quiz ON public.quiz_questions(quiz_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qq_admin_all" ON public.quiz_questions FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff'));
CREATE POLICY "qq_view_via_quiz" ON public.quiz_questions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_questions.quiz_id));

CREATE TABLE IF NOT EXISTS public.quiz_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_text text NOT NULL, is_correct boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_qo_q ON public.quiz_options(question_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_options TO authenticated;
GRANT ALL ON public.quiz_options TO service_role;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qo_admin_all" ON public.quiz_options FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff'));
CREATE POLICY "qo_view_via_question" ON public.quiz_options FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.quiz_questions WHERE id = quiz_options.question_id));

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL DEFAULT 1,
  status public.quiz_attempt_status NOT NULL DEFAULT 'in_progress',
  score numeric, max_score numeric, passed boolean,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz, graded_at timestamptz,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_qa_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_qa_student ON public.quiz_attempts(student_profile_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_admin_all" ON public.quiz_attempts FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff'));
CREATE POLICY "qa_student_self" ON public.quiz_attempts FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = quiz_attempts.student_profile_id AND sp.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = quiz_attempts.student_profile_id AND sp.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_option_ids uuid[], answer_text text,
  is_correct boolean, points_earned numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_qans_attempt ON public.quiz_answers(attempt_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_answers TO authenticated;
GRANT ALL ON public.quiz_answers TO service_role;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qans_admin_all" ON public.quiz_answers FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff'));
CREATE POLICY "qans_student_self" ON public.quiz_answers FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.quiz_attempts qa JOIN public.student_profiles sp ON sp.id = qa.student_profile_id
               WHERE qa.id = quiz_answers.attempt_id AND sp.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.quiz_attempts qa JOIN public.student_profiles sp ON sp.id = qa.student_profile_id
                    WHERE qa.id = quiz_answers.attempt_id AND sp.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number text NOT NULL UNIQUE,
  verify_code text NOT NULL UNIQUE,
  student_profile_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  program_id uuid REFERENCES public.training_programs(id) ON DELETE SET NULL,
  class_id uuid REFERENCES public.training_classes(id) ON DELETE SET NULL,
  title text NOT NULL, recipient_name text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz,
  pdf_path text, status public.certificate_status NOT NULL DEFAULT 'issued',
  issued_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cert_student ON public.certificates(student_profile_id);
CREATE INDEX IF NOT EXISTS idx_cert_verify ON public.certificates(verify_code);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT SELECT ON public.certificates TO anon;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cert_admin_all" ON public.certificates FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff'));
CREATE POLICY "cert_student_self" ON public.certificates FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.id = certificates.student_profile_id AND sp.user_id = auth.uid()));
CREATE POLICY "cert_public_verify" ON public.certificates FOR SELECT TO anon USING (status = 'issued');
CREATE TRIGGER trg_cert_updated BEFORE UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
