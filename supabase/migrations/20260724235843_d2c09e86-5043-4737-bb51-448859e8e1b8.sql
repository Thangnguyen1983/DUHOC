CREATE TABLE IF NOT EXISTS public.payment_settings (
  key text PRIMARY KEY,
  value text,
  is_secret boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_settings_admin_all" ON public.payment_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_payment_settings_updated
  BEFORE UPDATE ON public.payment_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.payment_settings(key, value, is_secret) VALUES
  ('PAY2S_MERCHANT_ID', '', true),
  ('PAY2S_API_KEY', '', true),
  ('PAY2S_HMAC_SECRET', '', true),
  ('PAY2S_ENDPOINT', '', false),
  ('MOMO_PARTNER_CODE', '', true),
  ('MOMO_ACCESS_KEY', '', true),
  ('MOMO_SECRET_KEY', '', true),
  ('MOMO_ENDPOINT', '', false),
  ('ZALOPAY_APP_ID', '', true),
  ('ZALOPAY_KEY1', '', true),
  ('ZALOPAY_KEY2', '', true),
  ('ZALOPAY_ENDPOINT', '', false),
  ('BANK_BIN', '970422', false),
  ('BANK_ACCOUNT_NO', '', false),
  ('BANK_ACCOUNT_NAME', 'CONG TY CP NHAN LUC QUOC TE KAIZEN', false),
  ('BANK_NAME', 'MB Bank', false)
ON CONFLICT (key) DO NOTHING;