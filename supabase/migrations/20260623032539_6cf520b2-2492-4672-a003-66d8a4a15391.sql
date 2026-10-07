DROP POLICY IF EXISTS "Public read journey-media" ON storage.objects;
CREATE POLICY "Authenticated read journey-media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'journey-media' AND has_role(auth.uid(), 'admin'::app_role));