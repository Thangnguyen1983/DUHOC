
CREATE POLICY "Public read journey-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'journey-media');

CREATE POLICY "Admins upload journey-media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'journey-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update journey-media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'journey-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete journey-media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'journey-media' AND public.has_role(auth.uid(), 'admin'));
