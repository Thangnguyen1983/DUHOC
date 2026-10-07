import { useEffect, useRef } from "react";
import { useT, type Lang } from "./i18n";
import { translateBatch } from "./translate.functions";

const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA", "INPUT", "SVG", "PATH",
]);

const CACHE_PREFIX = "kaizen.tr.";

function loadCache(lang: Lang): Record<string, string> {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + lang);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveCache(lang: Lang, cache: Record<string, string>) {
  try {
    localStorage.setItem(CACHE_PREFIX + lang, JSON.stringify(cache));
  } catch {}
}

// Original text per text-node (so we can restore or re-translate)
const originals = new WeakMap<Text, string>();

function shouldSkip(node: Node | null): boolean {
  let n: Node | null = node;
  while (n && n.nodeType !== 9) {
    if (n.nodeType === 1) {
      const el = n as Element;
      if (SKIP_TAGS.has(el.tagName)) return true;
      if (el.hasAttribute("data-no-translate")) return true;
      const editable = (el as HTMLElement).isContentEditable;
      if (editable) return true;
    }
    n = n.parentNode;
  }
  return false;
}

function collectTextNodes(root: Node): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const t = n as Text;
      const v = t.nodeValue;
      if (!v) return NodeFilter.FILTER_REJECT;
      if (!v.trim()) return NodeFilter.FILTER_REJECT;
      if (shouldSkip(t.parentNode)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let cur: Node | null;
  while ((cur = walker.nextNode())) out.push(cur as Text);
  return out;
}

function restoreOriginals(root: Node) {
  for (const node of collectTextNodes(root)) {
    const orig = originals.get(node);
    if (orig != null && node.nodeValue !== orig) node.nodeValue = orig;
  }
}

async function chunkedTranslate(
  lang: Exclude<Lang, "vi">,
  texts: string[],
  cache: Record<string, string>,
) {
  const CHUNK = 40;
  for (let i = 0; i < texts.length; i += CHUNK) {
    const slice = texts.slice(i, i + CHUNK);
    try {
      const res = await translateBatch({ data: { targetLang: lang, texts: slice } });
      slice.forEach((src, j) => {
        const v = res.translations[j];
        if (typeof v === "string" && v.trim()) cache[src] = v;
      });
      saveCache(lang, cache);
    } catch (e) {
      console.warn("[translate] batch failed", e);
      break;
    }
  }
}

export function PageTranslator() {
  const { lang } = useT();
  const runIdRef = useRef(0);
  const pendingRef = useRef<number | null>(null);

  useEffect(() => {
    const runId = ++runIdRef.current;

    if (lang === "vi") {
      restoreOriginals(document.body);
      return;
    }

    const cache = loadCache(lang);

    const apply = async () => {
      if (runIdRef.current !== runId) return;
      const nodes = collectTextNodes(document.body);
      const missing = new Set<string>();
      for (const node of nodes) {
        const orig = originals.get(node) ?? node.nodeValue ?? "";
        if (!originals.has(node)) originals.set(node, orig);
        const key = orig.trim();
        if (!key) continue;
        const cached = cache[key];
        if (cached != null) {
          // Preserve original whitespace around the translated value
          const lead = orig.match(/^\s*/)?.[0] ?? "";
          const tail = orig.match(/\s*$/)?.[0] ?? "";
          const next = lead + cached + tail;
          if (node.nodeValue !== next) node.nodeValue = next;
        } else if (key.length <= 2000) {
          missing.add(key);
        }
      }
      if (missing.size > 0) {
        await chunkedTranslate(lang, Array.from(missing), cache);
        if (runIdRef.current !== runId) return;
        // Re-apply with newly cached values
        for (const node of collectTextNodes(document.body)) {
          const orig = originals.get(node) ?? node.nodeValue ?? "";
          const key = orig.trim();
          const cached = cache[key];
          if (cached != null) {
            const lead = orig.match(/^\s*/)?.[0] ?? "";
            const tail = orig.match(/\s*$/)?.[0] ?? "";
            const next = lead + cached + tail;
            if (node.nodeValue !== next) node.nodeValue = next;
          }
        }
      }
    };

    void apply();

    // Re-translate when DOM changes (route changes, lazy content)
    const scheduleApply = () => {
      if (pendingRef.current != null) return;
      pendingRef.current = window.setTimeout(() => {
        pendingRef.current = null;
        void apply();
      }, 250);
    };
    const observer = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "characterData" || m.addedNodes.length > 0) {
          scheduleApply();
          return;
        }
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      if (pendingRef.current != null) {
        clearTimeout(pendingRef.current);
        pendingRef.current = null;
      }
    };
  }, [lang]);

  return null;
}
