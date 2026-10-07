INSERT INTO public.user_roles (user_id, role)
SELECT id, 'sales'::app_role FROM public.profiles
WHERE id IN (
  '477f48a8-6006-43c0-a677-64c8e2634b3b',
  '1cdea458-29eb-4a95-a742-f4a1750e8c65',
  '5387e95d-c6ee-42f0-8d17-21482188aed8'
)
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.sales_agents (user_id, display_name, markets, max_open_leads, claim_minutes, is_active)
SELECT p.id, COALESCE(p.full_name, 'Sales'),
       ARRAY['duc','nhat-ban','han-quoc','dai-loan','trung-quoc','ba-lan','hungary']::text[],
       20, 60, true
FROM public.profiles p
WHERE p.id IN (
  '477f48a8-6006-43c0-a677-64c8e2634b3b',
  '1cdea458-29eb-4a95-a742-f4a1750e8c65',
  '5387e95d-c6ee-42f0-8d17-21482188aed8'
)
AND NOT EXISTS (SELECT 1 FROM public.sales_agents s WHERE s.user_id = p.id);