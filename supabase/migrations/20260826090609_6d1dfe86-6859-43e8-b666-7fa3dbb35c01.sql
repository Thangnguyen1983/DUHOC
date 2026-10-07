
UPDATE public.cms_entries
SET data = jsonb_set(
  data, '{body}',
  to_jsonb(
    regexp_replace(
      data->>'body',
      E'(https://[^[:space:])]+)[[:space:]]+(webp\\?[A-Za-z0-9?=._-]+)',
      E'\\1\\2',
      'g'
    )
  )
)
WHERE data->>'body' ~ E'https://[^[:space:])]+[[:space:]]+webp\\?';
