
DO $$ BEGIN
  DROP POLICY IF EXISTS "cms_media_select_authed" ON storage.objects;
  DROP POLICY IF EXISTS "cms_media_insert_staff" ON storage.objects;
  DROP POLICY IF EXISTS "cms_media_update_staff" ON storage.objects;
  DROP POLICY IF EXISTS "cms_media_delete_staff" ON storage.objects;
END $$;

CREATE POLICY "cms_media_select_authed" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'cms-media');

CREATE POLICY "cms_media_insert_staff" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cms-media' AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'editor') OR
      public.has_role(auth.uid(), 'content') OR
      public.has_role(auth.uid(), 'seo') OR
      public.has_role(auth.uid(), 'marketing')
    )
  );

CREATE POLICY "cms_media_update_staff" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'cms-media' AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'editor') OR
      public.has_role(auth.uid(), 'content')
    )
  );

CREATE POLICY "cms_media_delete_staff" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'cms-media' AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'editor')
    )
  );
