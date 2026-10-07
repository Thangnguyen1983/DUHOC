import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaPicker } from "@/components/cms/media-picker";
import { Image as ImageIcon, X } from "lucide-react";
import { listTags, listCategories } from "@/lib/cms.functions";
import { AiWriterPanel } from "@/components/cms/ai-writer-panel";
import { ContentToolbar } from "@/components/cms/content-toolbar";
import { ContentPreview } from "@/components/cms/content-preview";
import { OutlinePanel } from "@/components/cms/outline-panel";
import { SeoScorePanel } from "@/components/cms/seo-score-panel";


export type EntryFormValue = {
  slug: string;
  title: string;
  excerpt: string;
  cover_image: string;
  data: { body?: string } & Record<string, any>;
  seo: {
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    canonical?: string;
    robots?: string;
    og_title?: string;
    og_description?: string;
    og_image?: string;
    twitter_card?: string;
    schema_jsonld?: string;
  };
  status: "draft" | "pending" | "scheduled" | "published" | "archived";
  scheduled_at: string | null;
  revision_note: string;
  category_ids: string[];
  tag_ids: string[];
  // Taxonomy market-centric
  module: "xkld" | "du-hoc" | "ngoai-ngu" | "outsourcing" | "visa" | "";
  market: string;
  pinned: boolean;
  featured: boolean;
};

const DEFAULT: EntryFormValue = {
  slug: "",
  title: "",
  excerpt: "",
  cover_image: "",
  data: { body: "" },
  seo: {},
  status: "draft",
  scheduled_at: null,
  revision_note: "",
  category_ids: [],
  tag_ids: [],
  module: "",
  market: "",
  pinned: false,
  featured: false,
};

const MODULE_OPTIONS: { value: EntryFormValue["module"]; label: string }[] = [
  { value: "", label: "— Không gắn module —" },
  { value: "xkld", label: "Nhân lực (XKLĐ)" },
  { value: "du-hoc", label: "Du học" },
  { value: "ngoai-ngu", label: "Ngoại ngữ" },
  { value: "outsourcing", label: "Outsourcing" },
  { value: "visa", label: "Visa" },
];

const MARKET_OPTIONS = [
  { value: "", label: "— Không gắn thị trường —" },
  { value: "nhat-ban", label: "🇯🇵 Nhật Bản" },
  { value: "han-quoc", label: "🇰🇷 Hàn Quốc" },
  { value: "dai-loan", label: "🇹🇼 Đài Loan" },
  { value: "duc", label: "🇩🇪 CHLB Đức" },
  { value: "hungary", label: "🇭🇺 Hungary" },
  { value: "ba-lan", label: "🇵🇱 Ba Lan" },
  { value: "romania", label: "🇷🇴 Romania" },
  { value: "slovakia", label: "🇸🇰 Slovakia" },
  { value: "latvia", label: "🇱🇻 Latvia" },
  { value: "bulgaria", label: "🇧🇬 Bulgaria" },
];

export function EntryForm({
  initial,
  onSubmit,
  loading,
  canPublish,
  typeSlug,
}: {
  initial?: Partial<EntryFormValue>;
  onSubmit: (v: EntryFormValue) => void;
  loading?: boolean;
  canPublish: boolean;
  typeSlug?: string;
}) {
  const isPost = typeSlug === "post";
  const isMarketHub = typeSlug === "market_hub";
  const requiresTaxonomy = isPost || isMarketHub;
  const initialSeo = { ...DEFAULT.seo, ...(initial?.seo ?? {}) };
  if (initialSeo.schema_jsonld && typeof initialSeo.schema_jsonld !== "string") {
    try { initialSeo.schema_jsonld = JSON.stringify(initialSeo.schema_jsonld, null, 2); }
    catch { initialSeo.schema_jsonld = ""; }
  }
  const [v, setV] = useState<EntryFormValue>({
    ...DEFAULT,
    ...initial,
    seo: initialSeo,
    data: { ...DEFAULT.data, ...(initial?.data ?? {}) },
    category_ids: initial?.category_ids ?? [],
    tag_ids: initial?.tag_ids ?? [],
  });
  const [tab, setTab] = useState<"content" | "seo" | "settings">("content");
  const [editorTab, setEditorTab] = useState<"write" | "preview" | "outline">("write");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [focusKeyword, setFocusKeyword] = useState<string>(
    (initial?.seo?.meta_keywords ?? "").split(",")[0]?.trim() ?? "",
  );

  function handleBodyKeys(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k !== "b" && k !== "i" && k !== "k") return;
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const body = v.data.body ?? "";
    const picked = body.slice(start, end);
    e.preventDefault();
    let inserted = "";
    if (k === "b") inserted = `**${picked || "văn bản"}**`;
    else if (k === "i") inserted = `*${picked || "văn bản"}*`;
    else {
      const url = window.prompt("Dán đường dẫn liên kết:", "https://");
      if (!url) return;
      inserted = `[${picked || "Xem chi tiết"}](${url})`;
    }
    const next = body.slice(0, start) + inserted + body.slice(end);
    setV((cur) => ({ ...cur, data: { ...cur.data, body: next } }));
    requestAnimationFrame(() => {
      const t = bodyRef.current;
      if (!t) return;
      t.focus();
      const caret = start + inserted.length;
      t.setSelectionRange(caret, caret);
    });
  }


  const fetchTags = useServerFn(listTags);
  const fetchCats = useServerFn(listCategories);
  const tagsQ = useQuery({ queryKey: ["cms-tags"], queryFn: () => fetchTags() });
  const catsQ = useQuery({ queryKey: ["cms-categories"], queryFn: () => fetchCats() });

  const toggle = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

  // SEO score đơn giản (client-side)
  const seoScore = computeSeoScore(v);

  // Autosave draft trong localStorage
  useEffect(() => {
    if (!v.title) return;
    const key = `cms-draft-${initial?.slug ?? "new"}`;
    const h = setTimeout(() => {
      try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
    }, 1200);
    return () => clearTimeout(h);
  }, [v, initial?.slug]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "content" | "seo" | "settings")}>
          <TabsList>
            {(["content","seo","settings"] as const).map((t) => (
              <TabsTrigger key={t} value={t}>
                {t === "content" ? "Nội dung" : t === "seo" ? `SEO (${seoScore}/100)` : "Thiết lập"}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {tab === "content" && (
          <div className="space-y-3">
            <AiWriterPanel
              currentTitle={v.title}
              onApply={(patch) =>
                setV((cur) => ({
                  ...cur,
                  ...patch,
                  data: { ...cur.data, ...(patch.data ?? {}) },
                  seo: { ...cur.seo, ...(patch.seo ?? {}) },
                }))
              }
            />
            <div>
              <Label>Tiêu đề *</Label>
              <Input value={v.title} maxLength={300}
                onChange={(e) => setV({ ...v, title: e.target.value, slug: v.slug || slugify(e.target.value) })} />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input value={v.slug} onChange={(e) => setV({ ...v, slug: slugify(e.target.value) })} />
              <p className="mt-1 text-xs text-muted-foreground">URL: /{v.slug}</p>
            </div>
            <div>
              <Label>Mô tả ngắn</Label>
              <Textarea rows={2} maxLength={600} value={v.excerpt} onChange={(e) => setV({ ...v, excerpt: e.target.value })} />
            </div>
            <div>
              <Label>Ảnh bìa</Label>
              <div className="flex gap-2">
                <Input value={v.cover_image} onChange={(e) => setV({ ...v, cover_image: e.target.value })} placeholder="Dán URL hoặc chọn từ thư viện" />
                <MediaPicker preset="hero" onPick={(m) => setV({ ...v, cover_image: m.url })} />
                {v.cover_image && (
                  <Button variant="outline" type="button" onClick={() => setV({ ...v, cover_image: "" })}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {v.cover_image && (
                <img src={v.cover_image} alt="cover preview" className="mt-2 h-32 w-auto rounded-md border object-cover" />
              )}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Nội dung (HTML/Markdown) *</Label>
                <Tabs value={editorTab} onValueChange={(v) => setEditorTab(v as "write" | "preview" | "outline")}>
                  <TabsList className="p-0.5">
                    <TabsTrigger value="write" className="px-2 py-1 text-xs">Soạn thảo</TabsTrigger>
                    <TabsTrigger value="outline" className="px-2 py-1 text-xs">Dàn ý SEO</TabsTrigger>
                    <TabsTrigger value="preview" className="px-2 py-1 text-xs">Xem trước</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {editorTab === "write" && (
                <>
                  <ContentToolbar
                    textareaRef={bodyRef}
                    value={v.data.body ?? ""}
                    onChange={(body) => setV((cur) => ({ ...cur, data: { ...cur.data, body } }))}
                  />
                  <Textarea
                    ref={bodyRef}
                    rows={18}
                    value={v.data.body ?? ""}
                    onChange={(e) => setV({ ...v, data: { ...v.data, body: e.target.value } })}
                    onKeyDown={handleBodyKeys}
                    className="font-mono text-xs"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Hỗ trợ chèn nhiều ảnh, video YouTube/Vimeo, icon và định dạng chữ tiếng Việt.
                    Phím tắt: Ctrl/Cmd + B (đậm), + I (nghiêng), + K (liên kết).
                  </p>
                </>
              )}

              {editorTab === "outline" && (
                <OutlinePanel
                  body={v.data.body ?? ""}
                  title={v.title}
                  keyword={focusKeyword}
                  onKeywordChange={(k) => {
                    setFocusKeyword(k);
                    setV((cur) =>
                      cur.seo.meta_keywords ? cur : { ...cur, seo: { ...cur.seo, meta_keywords: k } },
                    );
                  }}
                  onChange={(body) => setV((cur) => ({ ...cur, data: { ...cur.data, body } }))}
                />
              )}

              {editorTab === "preview" && (
                <div className="mt-2">
                  <ContentPreview body={v.data.body ?? ""} />
                </div>
              )}

              <div className="mt-3">
                <SeoScorePanel body={v.data.body ?? ""} title={v.title} keyword={focusKeyword} />
              </div>
            </div>


          </div>
        )}

        {tab === "seo" && (
          <div className="space-y-3">
            <SeoField label="Meta title" hint="≤60 ký tự" max={60}
              value={v.seo.meta_title ?? ""} onChange={(x) => setV({ ...v, seo: { ...v.seo, meta_title: x } })} />
            <SeoField label="Meta description" hint="≤160 ký tự" max={160} textarea
              value={v.seo.meta_description ?? ""} onChange={(x) => setV({ ...v, seo: { ...v.seo, meta_description: x } })} />
            <SeoField label="Từ khóa (comma)" value={v.seo.meta_keywords ?? ""}
              onChange={(x) => setV({ ...v, seo: { ...v.seo, meta_keywords: x } })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <SeoField label="Canonical URL" value={v.seo.canonical ?? ""}
                onChange={(x) => setV({ ...v, seo: { ...v.seo, canonical: x } })} />
              <SeoField label="Robots" value={v.seo.robots ?? ""}
                onChange={(x) => setV({ ...v, seo: { ...v.seo, robots: x } })} />
            </div>
            <SeoField label="OG title" value={v.seo.og_title ?? ""}
              onChange={(x) => setV({ ...v, seo: { ...v.seo, og_title: x } })} />
            <SeoField label="OG description" textarea value={v.seo.og_description ?? ""}
              onChange={(x) => setV({ ...v, seo: { ...v.seo, og_description: x } })} />
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">OG image (1200×630)</Label>
                <MediaPicker
                  preset="og"
                  trigger={<Button type="button" variant="ghost" size="sm"><ImageIcon className="mr-1 h-3.5 w-3.5" /> Chọn/Upload</Button>}
                  onPick={(m) => setV({ ...v, seo: { ...v.seo, og_image: m.url } })}
                />
              </div>
              <Input value={v.seo.og_image ?? ""} onChange={(x) => setV({ ...v, seo: { ...v.seo, og_image: x.target.value } })} />
            </div>
            <SeoField label="Schema JSON-LD" textarea value={v.seo.schema_jsonld ?? ""}
              onChange={(x) => setV({ ...v, seo: { ...v.seo, schema_jsonld: x } })} />
          </div>
        )}

        {tab === "settings" && (
          <div className="space-y-4">
            {requiresTaxonomy && (
              <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4">
                <div className="text-sm font-bold text-primary">
                  Phân loại thị trường {isPost && <span className="text-destructive">*</span>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Bắt buộc với bài viết. Hệ thống dùng cặp <b>Module + Thị trường</b> để
                  hiển thị bài đúng trang portal (VD /xkld/duc, /du-hoc/nhat-ban).
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Module *</Label>
                    <select
                      value={v.module}
                      onChange={(e) => setV({ ...v, module: e.target.value as EntryFormValue["module"] })}
                      className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      {MODULE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Thị trường *</Label>
                    <select
                      value={v.market}
                      onChange={(e) => setV({ ...v, market: e.target.value })}
                      className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      {MARKET_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-3 flex gap-4 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={v.pinned}
                      onChange={(e) => setV({ ...v, pinned: e.target.checked })}
                    />
                    Ghim đầu trang thị trường
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={v.featured}
                      onChange={(e) => setV({ ...v, featured: e.target.checked })}
                    />
                    Nổi bật (hiển thị lớn)
                  </label>
                </div>
              </div>
            )}

            <div>
              <Label>Ghi chú phiên bản</Label>
              <Input value={v.revision_note} maxLength={300}
                onChange={(e) => setV({ ...v, revision_note: e.target.value })}
                placeholder="Ví dụ: chỉnh title cho SEO" />
            </div>

            <div>
              <Label className="mb-1 block">Thẻ thị trường / chủ đề</Label>
              <p className="mb-2 text-xs text-muted-foreground">
                Gán thẻ thị trường (Đức, Đài Loan, Hàn Quốc…) để bài viết tự động
                hiện ở tab tương ứng trên trang Tin tức.
              </p>
              <div className="flex flex-wrap gap-2">
                {(tagsQ.data?.items ?? []).map((t: any) => {
                  const active = v.tag_ids.includes(t.id);
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setV({ ...v, tag_ids: toggle(v.tag_ids, t.id) })}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "hover:border-primary/50"
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
                {tagsQ.data && tagsQ.data.items.length === 0 && (
                  <span className="text-xs text-muted-foreground">Chưa có thẻ nào.</span>
                )}
              </div>
            </div>

            {(catsQ.data?.items?.length ?? 0) > 0 && (
              <div>
                <Label className="mb-1 block">Chuyên mục</Label>
                <div className="flex flex-wrap gap-2">
                  {catsQ.data!.items.map((c: any) => {
                    const active = v.category_ids.includes(c.id);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setV({ ...v, category_ids: toggle(v.category_ids, c.id) })}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          active
                            ? "border-secondary bg-secondary text-secondary-foreground"
                            : "hover:border-secondary/50"
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar phải: publish box */}
      <aside className="space-y-4">
        <div className="rounded-2xl border bg-card p-4">
          <div className="text-sm font-semibold">Trạng thái</div>
          <select value={v.status}
            onChange={(e) => setV({ ...v, status: e.target.value as EntryFormValue["status"] })}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm">
            <option value="draft">Nháp</option>
            <option value="pending">Gửi duyệt</option>
            <option value="scheduled">Hẹn giờ</option>
            {canPublish && <option value="published">Xuất bản ngay</option>}
            <option value="archived">Ẩn</option>
          </select>
          {v.status === "scheduled" && (
            <div className="mt-3">
              <Label className="text-xs">Đăng lúc</Label>
              <Input type="datetime-local"
                value={v.scheduled_at ? new Date(v.scheduled_at).toISOString().slice(0,16) : ""}
                onChange={(e) => setV({ ...v, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>
          )}
          <Button
            className="mt-4 w-full bg-primary"
            disabled={loading}
            onClick={() => {
              if (isPost && (!v.module || !v.market)) {
                setTab("settings");
                alert("Bài viết bắt buộc phải chọn Module và Thị trường.");
                return;
              }
              onSubmit(v);
            }}
          >
            {loading ? "Đang lưu..." : "Lưu"}
          </Button>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Autosave nháp mỗi 1.2s vào bộ nhớ trình duyệt.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-4">
          <div className="text-sm font-semibold">Đánh giá SEO</div>
          <div className="mt-2 text-2xl font-bold text-primary">{seoScore}<span className="text-xs text-muted-foreground">/100</span></div>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>Tiêu đề: {v.title.length} ký tự (khuyến nghị 30–60)</li>
            <li>Slug: {v.slug ? "✓" : "✗"}</li>
            <li>Mô tả: {v.excerpt.length} ký tự</li>
            <li>Meta title: {v.seo.meta_title?.length ?? 0} ký tự</li>
            <li>Meta desc: {v.seo.meta_description?.length ?? 0} ký tự</li>
            <li>OG image: {v.seo.og_image ? "✓" : "✗"}</li>
            <li>Ảnh bìa: {v.cover_image ? "✓" : "✗"}</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function SeoField({
  label, hint, value, onChange, max, textarea,
}: { label: string; hint?: string; value: string; onChange: (v: string) => void; max?: number; textarea?: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        {(hint || max) && (
          <span className={`text-[10px] ${max && value.length > max ? "text-destructive" : "text-muted-foreground"}`}>
            {value.length}{max ? `/${max}` : ""} {hint && `— ${hint}`}
          </span>
        )}
      </div>
      {textarea ? (
        <Textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

function computeSeoScore(v: EntryFormValue): number {
  let s = 0;
  if (v.title.length >= 20 && v.title.length <= 70) s += 15;
  else if (v.title.length > 0) s += 8;
  if (v.slug) s += 10;
  if (v.excerpt.length >= 80 && v.excerpt.length <= 200) s += 10;
  if (v.seo.meta_title && v.seo.meta_title.length <= 60) s += 15;
  if (v.seo.meta_description && v.seo.meta_description.length <= 160 && v.seo.meta_description.length >= 80) s += 15;
  if (v.seo.og_image) s += 10;
  if (v.cover_image) s += 10;
  if ((v.data.body ?? "").length > 300) s += 10;
  if (v.seo.canonical) s += 5;
  return Math.min(100, s);
}
