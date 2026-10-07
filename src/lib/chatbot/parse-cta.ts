import { COMPANY } from "@/lib/markets";

export type CTA = {
  type: "register" | "call" | "zalo";
  label: string;
  href?: string;
};

const CTA_REGEX = /\[\[CTA:({[^\]]+})\]\]/g;

/** Parse CTA tags from raw text, return cleaned text + cta list. */
export function parseCTAs(text: string): { text: string; ctas: CTA[] } {
  const ctas: CTA[] = [];
  const cleaned = text.replace(CTA_REGEX, (_match, json) => {
    try {
      const obj = JSON.parse(json);
      if (obj && typeof obj.type === "string" && typeof obj.label === "string") {
        ctas.push(resolveCTA(obj as CTA));
      }
    } catch {
      /* ignore malformed */
    }
    return "";
  });
  return { text: cleaned.trim(), ctas };
}

function resolveCTA(cta: CTA): CTA {
  if (cta.href) return cta;
  if (cta.type === "call") return { ...cta, href: `tel:${COMPANY.phoneRaw}` };
  if (cta.type === "zalo") return { ...cta, href: `https://zalo.me/${COMPANY.phoneRaw}` };
  return { ...cta, href: "/dang-ky" };
}
