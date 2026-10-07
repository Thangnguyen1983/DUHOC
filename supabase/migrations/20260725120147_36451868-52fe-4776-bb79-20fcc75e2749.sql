
-- 1. Certificates: remove broad anon full-table policy; verification stays via server function (supabaseAdmin) with verify_code
DROP POLICY IF EXISTS cert_public_verify ON public.certificates;

-- 2. Teachers: tighten broad authenticated view (contact info leaked). Keep self-view + admin_all.
DROP POLICY IF EXISTS teachers_authenticated_view ON public.teachers;

-- 3. Lesson attachments: scope to enrollment/teacher/admin, mirroring lessons_enrolled_view
DROP POLICY IF EXISTS lesson_att_view ON public.lesson_attachments;
CREATE POLICY lesson_att_enrolled_view ON public.lesson_attachments
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.lessons l
  WHERE l.id = lesson_attachments.lesson_id
    AND l.status = 'published'::lesson_status
    AND (
      EXISTS (
        SELECT 1 FROM public.training_enrollments te
        JOIN public.student_profiles sp ON sp.id = te.student_profile_id
        WHERE sp.user_id = auth.uid()
          AND (te.class_id = l.class_id OR EXISTS (
            SELECT 1 FROM public.training_classes tc
            WHERE tc.id = te.class_id AND tc.program_id = l.program_id
          ))
      )
      OR EXISTS (
        SELECT 1 FROM public.training_classes tc
        JOIN public.teachers t ON t.id = tc.teacher_id
        WHERE t.user_id = auth.uid()
          AND (tc.id = l.class_id OR tc.program_id = l.program_id)
      )
    )
));

-- 4. Quiz questions: mirror quizzes_enrolled_view scoping
DROP POLICY IF EXISTS qq_view_via_quiz ON public.quiz_questions;
CREATE POLICY qq_enrolled_view ON public.quiz_questions
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.quizzes q
  WHERE q.id = quiz_questions.quiz_id
    AND q.status = 'published'::quiz_status
    AND (
      EXISTS (
        SELECT 1 FROM public.training_enrollments te
        JOIN public.student_profiles sp ON sp.id = te.student_profile_id
        WHERE sp.user_id = auth.uid()
          AND (te.class_id = q.class_id OR EXISTS (
            SELECT 1 FROM public.training_classes tc
            WHERE tc.id = te.class_id AND tc.program_id = q.program_id
          ))
      )
      OR EXISTS (
        SELECT 1 FROM public.training_classes tc
        JOIN public.teachers t ON t.id = tc.teacher_id
        WHERE t.user_id = auth.uid()
          AND (tc.id = q.class_id OR tc.program_id = q.program_id)
      )
    )
));

-- 5. Quiz options: same enrollment scoping (through quiz_questions -> quizzes)
DROP POLICY IF EXISTS qo_view_via_question ON public.quiz_options;
CREATE POLICY qo_enrolled_view ON public.quiz_options
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.quiz_questions qq
  JOIN public.quizzes q ON q.id = qq.quiz_id
  WHERE qq.id = quiz_options.question_id
    AND q.status = 'published'::quiz_status
    AND (
      EXISTS (
        SELECT 1 FROM public.training_enrollments te
        JOIN public.student_profiles sp ON sp.id = te.student_profile_id
        WHERE sp.user_id = auth.uid()
          AND (te.class_id = q.class_id OR EXISTS (
            SELECT 1 FROM public.training_classes tc
            WHERE tc.id = te.class_id AND tc.program_id = q.program_id
          ))
      )
      OR EXISTS (
        SELECT 1 FROM public.training_classes tc
        JOIN public.teachers t ON t.id = tc.teacher_id
        WHERE t.user_id = auth.uid()
          AND (tc.id = q.class_id OR tc.program_id = q.program_id)
      )
    )
));

-- 6. Revoke EXECUTE from anon on SECURITY DEFINER helper functions (keep authenticated/service_role)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_wake() TO service_role;
