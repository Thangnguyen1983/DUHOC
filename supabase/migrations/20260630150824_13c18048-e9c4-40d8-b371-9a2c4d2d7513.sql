
-- Replace training_staff with training_manager in all new policies
DROP POLICY IF EXISTS "teachers_admin_all" ON public.teachers;
CREATE POLICY "teachers_admin_all" ON public.teachers FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'));

DROP POLICY IF EXISTS "lessons_admin_all" ON public.lessons;
CREATE POLICY "lessons_admin_all" ON public.lessons FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'));

DROP POLICY IF EXISTS "lesson_att_admin_all" ON public.lesson_attachments;
CREATE POLICY "lesson_att_admin_all" ON public.lesson_attachments FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'));

DROP POLICY IF EXISTS "lm_admin_all" ON public.learning_materials;
CREATE POLICY "lm_admin_all" ON public.learning_materials FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'));

DROP POLICY IF EXISTS "quizzes_admin_all" ON public.quizzes;
CREATE POLICY "quizzes_admin_all" ON public.quizzes FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'));

DROP POLICY IF EXISTS "qq_admin_all" ON public.quiz_questions;
CREATE POLICY "qq_admin_all" ON public.quiz_questions FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'));

DROP POLICY IF EXISTS "qo_admin_all" ON public.quiz_options;
CREATE POLICY "qo_admin_all" ON public.quiz_options FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'));

DROP POLICY IF EXISTS "qa_admin_all" ON public.quiz_attempts;
CREATE POLICY "qa_admin_all" ON public.quiz_attempts FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'));

DROP POLICY IF EXISTS "qans_admin_all" ON public.quiz_answers;
CREATE POLICY "qans_admin_all" ON public.quiz_answers FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'));

DROP POLICY IF EXISTS "cert_admin_all" ON public.certificates;
CREATE POLICY "cert_admin_all" ON public.certificates FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'))
WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager'));

DROP POLICY IF EXISTS "lesson_mat_admin_all" ON storage.objects;
CREATE POLICY "lesson_mat_admin_all" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'lesson-materials' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')))
WITH CHECK (bucket_id = 'lesson-materials' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')));

DROP POLICY IF EXISTS "cert_admin_all_storage" ON storage.objects;
CREATE POLICY "cert_admin_all_storage" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'certificates' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')))
WITH CHECK (bucket_id = 'certificates' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')));
