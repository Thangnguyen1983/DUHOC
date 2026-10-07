
CREATE POLICY "Staff read student-docs" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'student-docs' AND (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')
    OR public.has_role(auth.uid(),'consultant') OR public.has_role(auth.uid(),'visa_officer')
    OR public.has_role(auth.uid(),'departure_coordinator') OR public.has_role(auth.uid(),'cskh')
  )
);
CREATE POLICY "Staff write student-docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'student-docs' AND (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')
    OR public.has_role(auth.uid(),'consultant') OR public.has_role(auth.uid(),'visa_officer')
    OR public.has_role(auth.uid(),'departure_coordinator')
  )
);
CREATE POLICY "Staff update student-docs" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'student-docs' AND (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')
  )
);
CREATE POLICY "Admins delete student-docs" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'student-docs' AND (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'training_manager')
  )
);
