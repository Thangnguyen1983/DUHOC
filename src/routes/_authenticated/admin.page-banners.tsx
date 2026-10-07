import { errorMessage } from "@/lib/errors";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Save, RotateCcw, Trash2, Eye, Plus, X } from "lucide-react";
import {
  listAllPageBanners,
  upsertPageBanner,
  togglePageBanner,
  deletePageBanner,
  PAGE_BANNER_PRESETS,
  type PageBanner,
  type PageBannerStat,
} from "@/lib/page-banners.functions";
import { PremiumHero } from "@/components/premium-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/page-banners")({
  component: PageBannersAdmin,
});

type FormState = {
  page_key: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  image_url: string;
  overlay: "dark" | "brand" | "light";
  layout: "overlay" | "image";
  badge_label: string;
  badge_icon: string;
  cta_primary_label: string;
  cta_primary_href: string;
  cta_secondary_label: string;
  cta_secondary_href: string;
  stats: PageBannerStat[];
  is_active: boolean;
};

const EMPTY: FormState = {
  page_key: "",
  label: "",
  eyebrow: "",
  title: "",
  description: "",
  image_url: "",
  overlay: "dark",
  layout: "overlay",
  badge_label: "",
  badge_icon: "",
  cta_primary_label: "",
  cta_primary_href: "",
  cta_secondary_label: "",
  cta_secondary_href: "",
  stats: [],
  is_active: true,
};

function fromBanner(b: PageBanner): FormState {
  return {
    page_key: b.page_key,
    label: b.label,
    eyebrow: b.eyebrow ?? "",
    title: b.title ?? "",
    description: b.description ?? "",
    image_url: b.image_url ?? "",
    overlay: b.overlay,
    layout: b.layout ?? "overlay",
    badge_label: b.badge_label ?? "",
    badge_icon: b.badge_icon ?? "",
    cta_primary_label: b.cta_primary_label ?? "",
    cta_primary_href: b.cta_primary_href ?? "",
    cta_secondary_label: b.cta_secondary_label ?? "",
    cta_secondary_href: b.cta_secondary_href ?? "",
    stats: b.stats ?? [],
    is_active: b.is_active,
  };
}

function PageBannersAdmin() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(listAllPageBanners);
  const upsertFn = useServerFn(upsertPageBanner);
  const toggleFn = useServerFn(togglePageBanner);
  const deleteFn = useServerFn(deletePageBanner);

  const { data: banners = [] } = useQuery({
    queryKey: ["admin-page-banners"],
    queryFn: () => fetchAll(),
  });

  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [creatingKey, setCreatingKey] = useState<string | null>(null);

  // Kết hợp preset + banner đã lưu để hiển thị đầy đủ danh sách
  const rows = useMemo(() => {
    const map = new Map<string, { key: string; label: string; group: string; banner?: PageBanner }>();
    PAGE_BANNER_PRESETS.forEach((p) => map.set(p.key, { ...p }));
    banners.forEach((b) => {
      const existing = map.get(b.page_key);
      if (existing) {
        existing.banner = b;
        existing.label = b.label || existing.label;
      } else {
        map.set(b.page_key, {
          key: b.page_key,
          label: b.label,
          group: "Tuỳ chỉnh",
          banner: b,
        });
      }
    });
    return Array.from(map.values());
  }, [banners]);

  const filtered = rows.filter(
    (r) =>
      !search ||
      r.key.toLowerCase().includes(search.toLowerCase()) ||
      r.label.toLowerCase().includes(search.toLowerCase()),
  );

  const grouped = filtered.reduce<Record<string, typeof rows>>((acc, r) => {
    (acc[r.group] ??= []).push(r);
    return acc;
  }, {});

  function selectRow(row: (typeof rows)[number]) {
    setSelectedKey(row.key);
    setCreatingKey(null);
    if (row.banner) {
      setForm(fromBanner(row.banner));
    } else {
      setForm({ ...EMPTY, page_key: row.key, label: row.label });
    }
  }

  const upsertMut = useMutation({
    mutationFn: () =>
      upsertFn({
        data: {
          ...form,
          eyebrow: form.eyebrow || null,
          title: form.title || null,
          description: form.description || null,
          image_url: form.image_url || null,
          badge_label: form.badge_label || null,
          badge_icon: form.badge_icon || null,
          cta_primary_label: form.cta_primary_label || null,
          cta_primary_href: form.cta_primary_href || null,
          cta_secondary_label: form.cta_secondary_label || null,
          cta_secondary_href: form.cta_secondary_href || null,
        } as any,
      }),
    onSuccess: () => {
      toast.success("Đã lưu banner");
      setCreatingKey(null);
      qc.invalidateQueries({ queryKey: ["admin-page-banners"] });
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi khi lưu")),
  });

  const toggleMut = useMutation({
    mutationFn: (v: { page_key: string; is_active: boolean }) => toggleFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-page-banners"] }),
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });

  const deleteMut = useMutation({
    mutationFn: (page_key: string) => deleteFn({ data: { page_key } }),
    onSuccess: () => {
      toast.success("Đã xoá banner (quay về mặc định)");
      setSelectedKey(null);
      setForm(EMPTY);
      qc.invalidateQueries({ queryKey: ["admin-page-banners"] });
    },
    onError: (e: any) => toast.error(errorMessage(e, "Lỗi")),
  });

  function addStat() {
    if (form.stats.length >= 4) return;
    setForm({ ...form, stats: [...form.stats, { label: "", value: "" }] });
  }
  function updateStat(i: number, patch: Partial<PageBannerStat>) {
    const next = form.stats.slice();
    next[i] = { ...next[i], ...patch };
    setForm({ ...form, stats: next });
  }
  function removeStat(i: number) {
    setForm({ ...form, stats: form.stats.filter((_, idx) => idx !== i) });
  }

  function previewUrl() {
    const key = form.page_key;
    if (!key) return "/";
    if (key.startsWith("xkld:")) return `/xkld/${key.slice(5)}`;
    if (key.startsWith("ngoai-ngu:")) return `/ngoai-ngu/${key.slice(10)}`;
    if (key.startsWith("du-hoc:")) return `/du-hoc/${key.slice(7)}`;
    if (key === "doi-tac.truong") return "/doi-tac/truong";
    return `/${key}`;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Cài đặt Banner (Paner) toàn site</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Thay ảnh nền, tiêu đề, mô tả, CTA và thống kê nhanh cho banner đầu mỗi trang. Trang chưa
            cấu hình sẽ dùng thiết kế mặc định trong code.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            const key = window.prompt("Nhập page_key cho banner tuỳ chỉnh (vd: promotion-thang-7):");
            if (!key) return;
            setCreatingKey(key);
            setSelectedKey(key);
            setForm({ ...EMPTY, page_key: key, label: key });
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Banner tuỳ chỉnh
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* LEFT: list */}
        <aside className="rounded-2xl border bg-card p-4">
          <Input
            placeholder="Tìm banner…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-3"
          />
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group}
                </div>
                <ul className="space-y-1.5">
                  {items.map((r) => {
                    const isSelected = selectedKey === r.key;
                    const hasBanner = !!r.banner;
                    return (
                      <li key={r.key}>
                        <button
                          type="button"
                          onClick={() => selectRow(r)}
                          className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-transparent hover:bg-muted"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold">{r.label}</div>
                            <div className="truncate text-[11px] text-muted-foreground">{r.key}</div>
                          </div>
                          {hasBanner ? (
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                r.banner!.is_active
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {r.banner!.is_active ? "BẬT" : "TẮT"}
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              Mặc định
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* RIGHT: form + preview */}
        <section className="min-w-0 space-y-6">
          {!selectedKey ? (
            <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">
              Chọn một trang bên trái để bắt đầu chỉnh sửa banner.
            </div>
          ) : (
            <>
              {/* Preview */}
              <div className="overflow-hidden rounded-2xl border bg-card">
                <div className="border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Xem trước
                </div>
                <div className="max-h-[560px] overflow-hidden">
                  <PremiumHero
                    eyebrow={form.eyebrow || "Eyebrow"}
                    title={form.title || "Tiêu đề banner"}
                    description={form.description}
                    backgroundImage={form.image_url || undefined}
                    overlay={form.overlay}
                    layout={form.layout}
                    badge={form.badge_label ? { icon: form.badge_icon, label: form.badge_label } : undefined}
                    primaryCta={
                      form.cta_primary_label && form.cta_primary_href
                        ? { label: form.cta_primary_label, href: form.cta_primary_href }
                        : undefined
                    }
                    secondaryCta={
                      form.cta_secondary_label && form.cta_secondary_href
                        ? { label: form.cta_secondary_label, href: form.cta_secondary_href }
                        : undefined
                    }
                    stats={form.stats.filter((s) => s.label || s.value)}
                  />
                </div>
              </div>

              {/* Form */}
              <div className="rounded-2xl border bg-card p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Page key (route)">
                    <Input value={form.page_key} disabled={!creatingKey} readOnly={!creatingKey} />
                  </Field>
                  <Field label="Nhãn quản trị">
                    <Input
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                    />
                  </Field>
                  <Field label="Eyebrow (dòng nhỏ trên)">
                    <Input
                      value={form.eyebrow}
                      onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
                      placeholder="Ví dụ: Du học quốc tế"
                    />
                  </Field>
                  <Field label="Kiểu hiển thị banner" className="md:col-span-2">
                    <Select
                      value={form.layout}
                      onValueChange={(v: any) => setForm({ ...form, layout: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overlay">
                          Chữ đè ảnh — dùng cho ảnh chụp thường
                        </SelectItem>
                        <SelectItem value="image">
                          Ảnh thuần 100% — ảnh thiết kế sẵn có chữ, tiêu đề/CTA nằm dưới ảnh
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                      <strong>Ảnh thuần:</strong> ảnh hiển thị nguyên bản, sáng 100%, không có chữ đè
                      lên — chọn khi ảnh đã có sẵn tiêu đề, số liệu, bố cục riêng. Tiêu đề và nút CTA
                      vẫn hiện đầy đủ ngay dưới ảnh (giữ chuẩn SEO và bấm được).
                      <br />
                      <strong>Chữ đè ảnh:</strong> chọn khi dùng ảnh chụp thường, ảnh nên để trống
                      vùng bên trái cho phần chữ.
                      <br />
                      <strong>Kích thước khuyến nghị:</strong> 1920×1080 px (tỷ lệ 16:9), JPG/WebP, dưới 400KB.
                    </p>
                  </Field>
                  <Field label="Overlay (chỉ dùng cho kiểu chữ đè ảnh)">
                    <Select
                      value={form.overlay}
                      onValueChange={(v: any) => setForm({ ...form, overlay: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dark">Dark (nền tối)</SelectItem>
                        <SelectItem value="brand">Brand (đỏ/xanh KAIZEN)</SelectItem>
                        <SelectItem value="light">Light (nền sáng)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Tiêu đề — dùng [g]…[/g] để tô gradient" className="md:col-span-2">
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Chọn quốc gia [g]du học[/g]"
                    />
                  </Field>
                  <Field label="Mô tả ngắn" className="md:col-span-2">
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                    />
                  </Field>
                  <Field label="URL ảnh nền" className="md:col-span-2">
                    <Input
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      placeholder="https://… hoặc /assets/…"
                    />
                  </Field>
                  <Field label="Badge label">
                    <Input
                      value={form.badge_label}
                      onChange={(e) => setForm({ ...form, badge_label: e.target.value })}
                      placeholder="KAIZEN Global"
                    />
                  </Field>
                  <Field label="Badge icon (emoji)">
                    <Input
                      value={form.badge_icon}
                      onChange={(e) => setForm({ ...form, badge_icon: e.target.value })}
                      placeholder="🇯🇵"
                    />
                  </Field>
                  <Field label="CTA chính — nhãn">
                    <Input
                      value={form.cta_primary_label}
                      onChange={(e) => setForm({ ...form, cta_primary_label: e.target.value })}
                      placeholder="Đăng ký tư vấn"
                    />
                  </Field>
                  <Field label="CTA chính — link">
                    <Input
                      value={form.cta_primary_href}
                      onChange={(e) => setForm({ ...form, cta_primary_href: e.target.value })}
                      placeholder="#tu-van"
                    />
                  </Field>
                  <Field label="CTA phụ — nhãn">
                    <Input
                      value={form.cta_secondary_label}
                      onChange={(e) => setForm({ ...form, cta_secondary_label: e.target.value })}
                    />
                  </Field>
                  <Field label="CTA phụ — link">
                    <Input
                      value={form.cta_secondary_href}
                      onChange={(e) => setForm({ ...form, cta_secondary_href: e.target.value })}
                    />
                  </Field>
                </div>

                {/* Stats */}
                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <Label>Quick stats (tối đa 4 ô)</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addStat}
                      disabled={form.stats.length >= 4}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Thêm
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {form.stats.map((s, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <Input
                          placeholder="Nhãn"
                          value={s.label}
                          onChange={(e) => updateStat(i, { label: e.target.value })}
                        />
                        <Input
                          placeholder="Giá trị"
                          value={s.value}
                          onChange={(e) => updateStat(i, { value: e.target.value })}
                        />
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeStat(i)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {form.stats.length === 0 && (
                      <p className="text-xs text-muted-foreground">Chưa có ô thống kê nào.</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.is_active}
                      onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                    />
                    <span className="text-sm">Đang bật</span>
                  </div>
                  <div className="flex-1" />
                  <Button
                    variant="ghost"
                    onClick={() => window.open(previewUrl(), "_blank")}
                    disabled={!form.page_key}
                  >
                    <Eye className="mr-2 h-4 w-4" /> Xem trang
                  </Button>
                  {!creatingKey && banners.find((b) => b.page_key === form.page_key) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (window.confirm("Xoá banner này và quay về thiết kế mặc định?")) {
                          deleteMut.mutate(form.page_key);
                        }
                      }}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" /> Khôi phục mặc định
                    </Button>
                  )}
                  <Button onClick={() => upsertMut.mutate()} disabled={upsertMut.isPending}>
                    <Save className="mr-2 h-4 w-4" /> Lưu banner
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
