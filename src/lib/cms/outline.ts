/**
 * Phân tích & sắp xếp dàn ý (H1..H3) của nội dung bài viết.
 * Hỗ trợ cả Markdown (`## Tiêu đề`) lẫn HTML (`<h2>Tiêu đề</h2>`).
 * Pure functions, không phụ thuộc DOM — dùng được cả client lẫn server.
 */

export type OutlineSection = {
  /** id ổn định trong phiên làm việc, dùng cho React key */
  key: string;
  level: number;
  title: string;
  /** phần nội dung nằm dưới tiêu đề, chưa gồm dòng tiêu đề */
  content: string;
  format: "md" | "html";
};

export type Outline = {
  /** đoạn mở đầu trước tiêu đề đầu tiên */
  intro: string;
  sections: OutlineSection[];
  /** định dạng chủ đạo của body */
  format: "md" | "html";
};

const MD_HEADING = /^[ \t]{0,3}(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/gm;
const HTML_HEADING = /<h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;

function stripTags(s: string) {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export function parseOutline(body: string): Outline {
  const src = body ?? "";
  type Hit = { start: number; end: number; level: number; title: string; format: "md" | "html" };
  const hits: Hit[] = [];

  MD_HEADING.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MD_HEADING.exec(src))) {
    hits.push({
      start: m.index,
      end: m.index + m[0].length,
      level: m[1].length,
      title: m[2].replace(/[*_`]/g, "").trim(),
      format: "md",
    });
  }
  HTML_HEADING.lastIndex = 0;
  while ((m = HTML_HEADING.exec(src))) {
    hits.push({
      start: m.index,
      end: m.index + m[0].length,
      level: Number(m[1]),
      title: stripTags(m[2]),
      format: "html",
    });
  }
  hits.sort((a, b) => a.start - b.start);

  const htmlCount = hits.filter((h) => h.format === "html").length;
  const format: "md" | "html" =
    htmlCount > hits.length / 2 && hits.length > 0
      ? "html"
      : /<(p|div|section|article|ul|ol|table|figure)[\s>]/i.test(src) && hits.length === 0
        ? "html"
        : "md";

  const intro = hits.length > 0 ? src.slice(0, hits[0].start) : src;
  const sections: OutlineSection[] = hits.map((h, i) => ({
    key: `s${i}-${h.start}`,
    level: h.level,
    title: h.title,
    content: src.slice(h.end, i + 1 < hits.length ? hits[i + 1].start : src.length),
    format: h.format,
  }));

  return { intro, sections, format };
}

export function renderHeading(level: number, title: string, format: "md" | "html"): string {
  const lv = Math.min(6, Math.max(1, level));
  return format === "html" ? `<h${lv}>${title}</h${lv}>` : `${"#".repeat(lv)} ${title}`;
}

export function serializeOutline(outline: Outline): string {
  const parts: string[] = [];
  const intro = outline.intro.replace(/\s+$/, "");
  if (intro.trim()) parts.push(intro);
  for (const s of outline.sections) {
    const heading = renderHeading(s.level, s.title, s.format ?? outline.format);
    const content = s.content.replace(/^\s+|\s+$/g, "");
    parts.push(content ? `${heading}\n\n${content}` : heading);
  }
  return parts.join("\n\n") + "\n";
}

/** Nhóm: một mục cấp cao kèm mọi mục con phía sau nó. */
function groupRanges(sections: OutlineSection[], atLevel: number): [number, number][] {
  const ranges: [number, number][] = [];
  let i = 0;
  while (i < sections.length) {
    if (sections[i].level <= atLevel) {
      let j = i + 1;
      while (j < sections.length && sections[j].level > sections[i].level) j++;
      ranges.push([i, j]);
      i = j;
    } else {
      ranges.push([i, i + 1]);
      i += 1;
    }
  }
  return ranges;
}

/**
 * Di chuyển một mục lên/xuống, kéo theo toàn bộ mục con của nó.
 * Chỉ hoán đổi với mục ngang cấp liền kề.
 */
export function moveSection(sections: OutlineSection[], index: number, dir: -1 | 1): OutlineSection[] {
  const target = sections[index];
  if (!target) return sections;
  const ranges = groupRanges(sections, target.level);
  const pos = ranges.findIndex(([s]) => s === index);
  if (pos < 0) return sections;
  const other = pos + dir;
  if (other < 0 || other >= ranges.length) return sections;
  // chỉ hoán đổi khi mục kề cùng cấp
  if (sections[ranges[other][0]].level !== target.level) return sections;

  const a = ranges[Math.min(pos, other)];
  const b = ranges[Math.max(pos, other)];
  const before = sections.slice(0, a[0]);
  const first = sections.slice(a[0], a[1]);
  const second = sections.slice(b[0], b[1]);
  const after = sections.slice(b[1]);
  return [...before, ...second, ...first, ...after];
}

export function updateSection(
  sections: OutlineSection[],
  index: number,
  patch: Partial<Pick<OutlineSection, "title" | "level">>,
): OutlineSection[] {
  return sections.map((s, i) => (i === index ? { ...s, ...patch } : s));
}

export function removeSection(sections: OutlineSection[], index: number): OutlineSection[] {
  return sections.filter((_, i) => i !== index);
}

export function insertSection(
  sections: OutlineSection[],
  index: number,
  section: { level: number; title: string; content?: string; format?: "md" | "html" },
): OutlineSection[] {
  const item: OutlineSection = {
    key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    level: section.level,
    title: section.title,
    content: section.content ?? "",
    format: section.format ?? "md",
  };
  const next = [...sections];
  next.splice(Math.max(0, Math.min(index, sections.length)), 0, item);
  return next;
}

function normTitle(t: string) {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  const wa = new Set(normTitle(a).split(" ").filter(Boolean));
  const wb = new Set(normTitle(b).split(" ").filter(Boolean));
  if (wa.size === 0 || wb.size === 0) return 0;
  let hit = 0;
  wa.forEach((w) => {
    if (wb.has(w)) hit++;
  });
  return hit / Math.max(wa.size, wb.size);
}

/**
 * Sắp xếp lại các mục hiện có theo thứ tự dàn ý gợi ý.
 * Mục không khớp gợi ý nào được giữ nguyên thứ tự tương đối, đặt ở cuối.
 */
export function reorderBySuggestion(
  sections: OutlineSection[],
  suggested: { title: string; level: number }[],
): OutlineSection[] {
  const used = new Set<number>();
  const ordered: OutlineSection[] = [];
  const ranges = groupRanges(sections, 2);

  for (const sug of suggested) {
    let best = -1;
    let bestScore = 0.34;
    ranges.forEach(([s], gi) => {
      if (used.has(gi)) return;
      const score = similarity(sections[s].title, sug.title);
      if (score > bestScore) {
        bestScore = score;
        best = gi;
      }
    });
    if (best >= 0) {
      used.add(best);
      const [s, e] = ranges[best];
      ordered.push(...sections.slice(s, e));
    }
  }
  ranges.forEach(([s, e], gi) => {
    if (!used.has(gi)) ordered.push(...sections.slice(s, e));
  });
  return ordered;
}
