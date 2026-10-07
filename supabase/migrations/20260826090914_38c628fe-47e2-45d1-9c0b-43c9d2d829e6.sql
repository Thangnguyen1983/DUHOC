
UPDATE public.cms_entries
SET data = jsonb_set(
  data, '{body}',
  to_jsonb(
    regexp_replace(
      data->>'body',
      'https://[^\s)]*c2007acf-0549-4740-9b16-83ce3eb85f54-5\.webp\?token=[^\s)]*',
      'https://urpecvemnevheoldgirh.supabase.co/storage/v1/object/sign/cms-media/2026-07/c2007acf-0549-4740-9b16-83ce3eb85f54-5.webp?token=eyJraWQiOiI3ZmM3ZTRmMS0yOGExLTQyMGMtODE5Ny1lMWJiMzk0NGJhNjMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbXMtbWVkaWEvMjAyNi0wNy9jMjAwN2FjZi0wNTQ5LTQ3NDAtOWIxNi04M2NlM2ViODVmNTQtNS53ZWJwIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NzczNTMzMSwiZXhwIjoyMTAzMDk1MzMxfQ.MkBydhYU9Og9pGkwcwI0ciyxYi75ILzlkN3My7WQ3zM',
      'g'
    )
  )
)
WHERE data->>'body' LIKE '%c2007acf-0549-4740-9b16-83ce3eb85f54-5.webp%';
