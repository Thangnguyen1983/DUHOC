import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitConsultation } from "@/lib/consultations.functions";
import { useMarkets } from "@/lib/markets.catalog";

export function ConsultationForm({
  defaultProgram = "du_hoc",
  defaultMarket,
  variant = "card",
}: {
  defaultProgram?: "du_hoc" | "xkld" | "khac";
  defaultMarket?: string;
  variant?: "card" | "plain";
}) {
  const submit = useServerFn(submitConsultation);
  const { all: markets } = useMarkets();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    program: defaultProgram,
    market: defaultMarket ?? "",
    message: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const sp = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
      await submit({
        data: {
          ...form,
          campaign_code: sp.get("campaign") ?? "",
          utm_source: sp.get("utm_source") ?? "",
          utm_medium: sp.get("utm_medium") ?? "",
          utm_campaign: sp.get("utm_campaign") ?? "",
          utm_content: sp.get("utm_content") ?? "",
          utm_term: sp.get("utm_term") ?? "",
        },
      });
      setDone(true);
      toast.success("Đã gửi đăng ký! KAIZEN sẽ liên hệ trong vòng 24h.");
      setForm({
        full_name: "",
        phone: "",
        email: "",
        program: defaultProgram,
        market: defaultMarket ?? "",
        message: "",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const wrapper =
    variant === "card"
      ? "rounded-2xl border bg-card p-6 shadow-soft md:p-8"
      : "";

  return (
    <form onSubmit={onSubmit} className={wrapper}>
      {variant === "card" && (
        <div className="mb-5">
          <h3 className="text-xl font-bold">Đăng ký tư vấn miễn phí</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Để lại thông tin, chuyên viên KAIZEN sẽ liên hệ trong 24h.
          </p>
        </div>
      )}

      {done && (
        <div className="mb-4 rounded-lg border border-secondary/40 bg-accent p-3 text-sm text-secondary">
          ✓ Cảm ơn bạn! Chúng tôi đã nhận được thông tin.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="full_name">Họ và tên *</Label>
          <Input
            id="full_name"
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Nguyễn Văn A"
          />
        </div>
        <div>
          <Label htmlFor="phone">Số điện thoại *</Label>
          <Input
            id="phone"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="09xx xxx xxx"
            inputMode="tel"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="email@example.com"
          />
        </div>
        <div>
          <Label htmlFor="program">Chương trình *</Label>
          <Select
            value={form.program}
            onValueChange={(v) => setForm({ ...form, program: v as any })}
          >
            <SelectTrigger id="program"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="du_hoc">Du học</SelectItem>
              <SelectItem value="xkld">Xuất khẩu lao động</SelectItem>
              <SelectItem value="khac">Khác</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="market">Thị trường quan tâm</Label>
          <Select
            value={form.market || "none"}
            onValueChange={(v) => setForm({ ...form, market: v === "none" ? "" : v })}
          >
            <SelectTrigger id="market"><SelectValue placeholder="Chọn thị trường" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Chưa xác định</SelectItem>
              {markets.map((m) => (
                <SelectItem key={m.slug} value={m.slug}>{m.flag} {m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="message">Ghi chú</Label>
          <Textarea
            id="message"
            rows={3}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Mong muốn của bạn..."
          />
        </div>
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="mt-5 w-full bg-primary text-base font-semibold hover:bg-primary/90"
        size="lg"
      >
        {loading ? "Đang gửi..." : "Gửi đăng ký"}
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Thông tin của bạn được bảo mật tuyệt đối.
      </p>
    </form>
  );
}
