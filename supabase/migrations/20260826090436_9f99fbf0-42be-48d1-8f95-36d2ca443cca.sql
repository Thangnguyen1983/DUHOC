
DO $mig$
DECLARE
  r record;
  b text;
  m text[];
BEGIN
  FOR r IN SELECT id, data->>'body' AS body FROM public.cms_entries WHERE data->>'body' LIKE '%](http%' LOOP
    b := r.body;
    b := regexp_replace(b, '(https://[^\s)]+)\s+([A-Za-z0-9?=._-]+)', '\1\2', 'g');
    FOR m IN SELECT regexp_matches(b, '\]\(([^)]*)\)', 'g') LOOP
      IF m[1] ~ '\s' THEN
        b := replace(b, '](' || m[1] || ')', '](' || regexp_replace(m[1], '\s+', '', 'g') || ')');
      END IF;
    END LOOP;
    IF b IS DISTINCT FROM r.body THEN
      UPDATE public.cms_entries SET data = jsonb_set(data, '{body}', to_jsonb(b)) WHERE id = r.id;
    END IF;
  END LOOP;
END
$mig$;
