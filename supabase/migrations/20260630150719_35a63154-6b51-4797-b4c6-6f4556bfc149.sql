
DO $$ BEGIN
CREATE POLICY "lesson_mat_admin_all" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'lesson-materials' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff')))
WITH CHECK (bucket_id = 'lesson-materials' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff')));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "lesson_mat_authenticated_view" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'lesson-materials');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "cert_admin_all_storage" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'certificates' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff')))
WITH CHECK (bucket_id = 'certificates' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_staff')));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "cert_authenticated_view" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'certificates');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
