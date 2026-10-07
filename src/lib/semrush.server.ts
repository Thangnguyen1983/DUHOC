/**
 * Semrush gateway helper — chỉ dùng ở server (edge worker).
 * Trả về `null` nếu chưa kết nối SEMRUSH_API_KEY để pipeline biết fallback.
 */

const GATEWAY = "https://connector-gateway.lovable.dev/semrush";

export function isSemrushConfigured(): boolean {
  return Boolean(process.env.SEMRUSH_API_KEY && process.env.LOVABLE_API_KEY);
}

async function callSemrush(path: string, params: Record<string, string>): Promise<
  { columnNames: string[]; rows: Record<string, string>[] } | { error: string }
> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const semrushKey = process.env.SEMRUSH_API_KEY;
  if (!lovableKey || !semrushKey) return { error: "semrush_not_configured" };

  const qs = new URLSearchParams(params).toString();
  const url = `${GATEWAY}${path}?${qs}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": semrushKey,
      "Allow-Limit-Offset": "true",
    },
  });
  const text = await res.text();
  if (!res.ok) return { error: `semrush_http_${res.status}: ${text.slice(0, 200)}` };
  try {
    const json = JSON.parse(text) as {
      data?: { columnNames: string[]; rows: (string[] | Record<string, string>)[] };
      error?: string;
    };
    if (json.error) return { error: json.error };
    const data = json.data;
    if (!data) return { columnNames: [], rows: [] };
    // Semrush trả rows có thể là array of arrays hoặc array of objects
    const rows = data.rows.map((r) => {
      if (Array.isArray(r)) {
        const o: Record<string, string> = {};
        data.columnNames.forEach((c, i) => (o[c] = r[i] ?? ""));
        return o;
      }
      return r;
    });
    return { columnNames: data.columnNames, rows };
  } catch (e) {
    return { error: `parse_error: ${(e as Error).message}` };
  }
}

export type KeywordRow = {
  keyword: string;
  volume: number;
  difficulty?: number;
  cpc?: number;
  competition?: number;
  intent?: string;
};

function toKeywordRow(r: Record<string, string>): KeywordRow {
  return {
    keyword: r["Ph"] ?? r["Keyword"] ?? "",
    volume: Number(r["Nq"] ?? r["Search Volume"] ?? 0) || 0,
    difficulty: r["Kd"] ? Number(r["Kd"]) : undefined,
    cpc: r["Cp"] ? Number(r["Cp"]) : undefined,
    competition: r["Co"] ? Number(r["Co"]) : undefined,
    intent: r["In"] ?? undefined,
  };
}

export async function researchKeyword(
  phrase: string,
  database = "vn",
  limit = 20,
): Promise<{
  primary: KeywordRow | null;
  related: KeywordRow[];
  questions: KeywordRow[];
  serpTop: { url: string; title: string; domain: string }[];
  warnings: string[];
}> {
  const warnings: string[] = [];
  const common = { phrase, database, display_limit: String(limit) };

  const [phraseThis, related, questions, organic] = await Promise.all([
    callSemrush("/keywords/phrase_this", {
      ...common,
      export_columns: "Ph,Nq,Cp,Co,Kd,In",
    }),
    callSemrush("/keywords/phrase_related", {
      ...common,
      export_columns: "Ph,Nq,Cp,Co,Kd",
    }),
    callSemrush("/keywords/phrase_questions", {
      ...common,
      export_columns: "Ph,Nq,Cp,Kd",
    }),
    callSemrush("/keywords/phrase_organic", {
      ...common,
      display_limit: "10",
      export_columns: "Dn,Ur,Tt",
    }),
  ]);

  const pickRows = (r: typeof phraseThis) => {
    if ("error" in r) {
      warnings.push(r.error);
      return [];
    }
    return r.rows;
  };

  return {
    primary: (() => {
      const rows = pickRows(phraseThis);
      return rows[0] ? toKeywordRow(rows[0]) : null;
    })(),
    related: pickRows(related).map(toKeywordRow),
    questions: pickRows(questions).map(toKeywordRow),
    serpTop: pickRows(organic).map((r) => ({
      url: r["Ur"] ?? "",
      title: r["Tt"] ?? "",
      domain: r["Dn"] ?? "",
    })),
    warnings,
  };
}
