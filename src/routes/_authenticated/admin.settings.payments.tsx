import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPaymentSettings, updatePaymentSettings } from "@/lib/payments/settings.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreditCard, Eye, EyeOff, ShieldCheck, Building2, Wallet, Landmark } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/settings/payments")({
  component: PaymentSettingsPage,
});

type Item = { key: string; is_secret: boolean; has_value: boolean; value: string };

const GROUPS: { title: string; icon: any; desc: string; keys: { key: string; label: string; hint?: string; placeholder?: string }[] }[] = [
  {
    title: "PAY2S", icon: CreditCard, desc: "Cổng thanh toán nội địa Việt Nam. Đăng ký tại pay2s.vn.",
    keys: [
      { key: "PAY2S_MERCHANT_ID", label: "Merchant ID" },
      { key: "PAY2S_API_KEY", label: "API Key" },
      { key: "PAY2S_HMAC_SECRET", label: "HMAC Secret" },
      { key: "PAY2S_ENDPOINT", label: "Endpoint (tuỳ chọn)", placeholder: "https://api.pay2s.vn/v2/checkout" },
    ],
  },
  {
    title: "MoMo", icon: Wallet, desc: "Đăng ký doanh nghiệp tại business.momo.vn để lấy Partner Code + Access Key + Secret Key.",
    keys: [
      { key: "MOMO_PARTNER_CODE", label: "Partner Code" },
      { key: "MOMO_ACCESS_KEY", label: "Access Key" },
      { key: "MOMO_SECRET_KEY", label: "Secret Key" },
      { key: "MOMO_ENDPOINT", label: "Endpoint (để trống = production)", placeholder: "https://payment.momo.vn/v2/gateway/api/create" },
    ],
  },
  {
    title: "ZaloPay", icon: ShieldCheck, desc: "Đăng ký doanh nghiệp tại zalopay.vn — lấy App ID, Key1, Key2.",
    keys: [
      { key: "ZALOPAY_APP_ID", label: "App ID" },
      { key: "ZALOPAY_KEY1", label: "Key1 (tạo đơn)" },
      { key: "ZALOPAY_KEY2", label: "Key2 (verify callback)" },
      { key: "ZALOPAY_ENDPOINT", label: "Endpoint (để trống = production)", placeholder: "https://openapi.zalopay.vn/v2/create" },
    ],
  },
  {
    title: "Chuyển khoản QR (VietQR)", icon: Landmark, desc: "Thông tin ngân hàng KAIZEN — hiển thị QR để học viên chuyển khoản.",
    keys: [
      { key: "BANK_BIN", label: "Bank BIN", hint: "VD: 970422 (MB Bank), 970436 (Vietcombank), 970418 (BIDV)", placeholder: "970422" },
      { key: "BANK_ACCOUNT_NO", label: "Số tài khoản" },
      { key: "BANK_ACCOUNT_NAME", label: "Chủ tài khoản", placeholder: "CONG TY CP NHAN LUC QUOC TE KAIZEN" },
      { key: "BANK_NAME", label: "Tên ngân hàng", placeholder: "MB Bank" },
    ],
  },
];

function PaymentSettingsPage() {
  const fetchAll = useServerFn(getPaymentSettings);
  const save = useServerFn(updatePaymentSettings);
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ["payment-settings"], queryFn: () => fetchAll() });
  const [values, setValues] = useState<Record<string, string>>({});
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (q.data) {
      const init: Record<string, string> = {};
      for (const it of q.data.items) init[it.key] = it.is_secret ? "" : it.value;
      setValues(init);
    }
  }, [q.data]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(values)
        .filter(([, v]) => v !== "" && v !== undefined)
        .map(([key, value]) => ({ key, value }));
      if (entries.length === 0) throw new Error("Chưa có thay đổi nào để lưu.");
      return save({ data: { entries } });
    },
    onSuccess: (r) => {
      toast.success(`Đã cập nhật ${r.updated} khoá cấu hình.`);
      qc.invalidateQueries({ queryKey: ["payment-settings"] });
    },
    onError: (e: any) => toast.error(errorMessage(e)),
  });

  const itemMap = new Map((q.data?.items ?? []).map((i: Item) => [i.key, i]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="h-6 w-6" /> Cài đặt cổng thanh toán</h1>
        <p className="text-sm text-muted-foreground">Cập nhật API keys cho các cổng thanh toán khoá học. Giá trị bí mật (secret) được che sau khi lưu.</p>
      </div>

      <div className="rounded-2xl border bg-amber-50 p-4 text-xs text-amber-900">
        <b>Webhook URLs (dán vào dashboard nhà cung cấp):</b>
        <ul className="mt-1 list-disc pl-5 space-y-0.5 font-mono">
          <li>PAY2S IPN: <code>https://kaizen-duhoc-xkld.lovable.app/api/public/payments/pay2s/ipn</code></li>
          <li>MoMo IPN: <code>https://kaizen-duhoc-xkld.lovable.app/api/public/payments/momo/ipn</code></li>
          <li>ZaloPay callback: <code>https://kaizen-duhoc-xkld.lovable.app/api/public/payments/zalopay/ipn</code></li>
          <li>Return URL (chung): <code>https://kaizen-duhoc-xkld.lovable.app/api/public/payments/{"{provider}"}/return</code></li>
        </ul>
      </div>

      {q.isLoading && <div className="text-muted-foreground">Đang tải cấu hình...</div>}

      {q.data && (
        <div className="space-y-6">
          {GROUPS.map((g) => {
            const Icon = g.icon;
            const configuredCount = g.keys.filter((k) => itemMap.get(k.key)?.has_value).length;
            return (
              <section key={g.title} className="rounded-2xl border bg-card p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-lg flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /> {g.title}</h2>
                    <p className="text-xs text-muted-foreground mt-1">{g.desc}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${configuredCount === g.keys.length ? "bg-emerald-100 text-emerald-700" : configuredCount === 0 ? "bg-muted text-muted-foreground" : "bg-amber-100 text-amber-700"}`}>
                    {configuredCount}/{g.keys.length} khoá
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {g.keys.map((f) => {
                    const it = itemMap.get(f.key);
                    const isSecret = !!it?.is_secret;
                    const isRevealed = reveal[f.key];
                    return (
                      <div key={f.key} className="space-y-1.5">
                        <Label className="text-xs font-medium flex items-center gap-2">
                          {f.label}
                          {it?.has_value && <span className="rounded-full bg-emerald-100 text-emerald-700 px-1.5 text-[10px]">Đã có</span>}
                          {isSecret && <span className="rounded-full bg-muted text-muted-foreground px-1.5 text-[10px]">Secret</span>}
                        </Label>
                        <div className="relative">
                          <Input
                            type={isSecret && !isRevealed ? "password" : "text"}
                            value={values[f.key] ?? ""}
                            placeholder={it?.has_value && isSecret ? it.value : f.placeholder ?? "Chưa cấu hình"}
                            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                            className="pr-10 font-mono text-sm"
                          />
                          {isSecret && (
                            <button type="button" onClick={() => setReveal((r) => ({ ...r, [f.key]: !r[f.key] }))}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
                              {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                        {f.hint && <p className="text-[11px] text-muted-foreground">{f.hint}</p>}
                        {isSecret && it?.has_value && <p className="text-[11px] text-muted-foreground">Để trống nếu không muốn thay đổi giá trị hiện tại.</p>}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <div className="sticky bottom-4 flex justify-end gap-2 rounded-2xl border bg-card/95 backdrop-blur p-4 shadow-lg">
            <Button variant="outline" onClick={() => q.refetch()}>Tải lại</Button>
            <Button disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
              {saveMut.isPending ? "Đang lưu..." : "Lưu cấu hình"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
