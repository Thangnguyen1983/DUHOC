/**
 * Trình ghi Excel (OOXML) tối giản, có định dạng theo màu nhận diện Kaizen.
 * SheetJS bản cộng đồng không ghi được style ô, nên dựng file trực tiếp và
 * đóng gói bằng fflate (chạy được trên Worker).
 */

export type ReportSheet = {
  /** Tên sheet (sẽ được làm sạch, tối đa 31 ký tự) */
  name: string;
  /** Tiêu đề lớn dòng 1 */
  title: string;
  /** Dòng phụ dưới tiêu đề */
  subtitle?: string;
  kind: "fields" | "table";
  headers: string[];
  rows: string[][];
  footer?: string;
};

const BRAND_RED = "C92026";
const BRAND_GREEN = "3F7D3A";
const STRIPE = "F6F1F1";
const LABEL_BG = "EFEFEF";
const BORDER = "D6D3D1";

function esc(v: string): string {
  return v
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function colName(i: number): string {
  let s = "";
  let n = i + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Chỉ số style trong cellXfs */
const S = {
  DEFAULT: 0,
  TITLE: 1,
  SUBTITLE: 2,
  HEADER: 3,
  BODY: 4,
  BODY_ALT: 5,
  LABEL: 6,
  FOOTER: 7,
  COVER_TITLE: 8,
} as const;

function stylesXml(): string {
  const fonts = [
    `<font><sz val="11"/><name val="Arial"/></font>`,
    `<font><b/><sz val="14"/><color rgb="FFFFFFFF"/><name val="Arial"/></font>`,
    `<font><i/><sz val="10"/><color rgb="FF6B7280"/><name val="Arial"/></font>`,
    `<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font>`,
    `<font><b/><sz val="11"/><color rgb="FF1F2937"/><name val="Arial"/></font>`,
    `<font><b/><sz val="16"/><color rgb="FF${BRAND_RED}"/><name val="Arial"/></font>`,
  ].join("");

  const fills = [
    `<fill><patternFill patternType="none"/></fill>`,
    `<fill><patternFill patternType="gray125"/></fill>`,
    `<fill><patternFill patternType="solid"><fgColor rgb="FF${BRAND_RED}"/><bgColor indexed="64"/></patternFill></fill>`,
    `<fill><patternFill patternType="solid"><fgColor rgb="FF${BRAND_GREEN}"/><bgColor indexed="64"/></patternFill></fill>`,
    `<fill><patternFill patternType="solid"><fgColor rgb="FF${STRIPE}"/><bgColor indexed="64"/></patternFill></fill>`,
    `<fill><patternFill patternType="solid"><fgColor rgb="FF${LABEL_BG}"/><bgColor indexed="64"/></patternFill></fill>`,
  ].join("");

  const thin = `<left style="thin"><color rgb="FF${BORDER}"/></left><right style="thin"><color rgb="FF${BORDER}"/></right><top style="thin"><color rgb="FF${BORDER}"/></top><bottom style="thin"><color rgb="FF${BORDER}"/></bottom>`;
  const borders = [`<border/>`, `<border>${thin}</border>`].join("");

  const xf = (
    font: number,
    fill: number,
    border: number,
    align: string,
  ) =>
    `<xf numFmtId="0" fontId="${font}" fillId="${fill}" borderId="${border}" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">${align}</xf>`;

  const alignWrapTop = `<alignment vertical="top" wrapText="1"/>`;
  const alignCenter = `<alignment horizontal="center" vertical="center" wrapText="1"/>`;
  const alignLeftMid = `<alignment horizontal="left" vertical="center" wrapText="1"/>`;

  const cellXfs = [
    xf(0, 0, 0, alignWrapTop), // DEFAULT
    xf(1, 2, 0, alignLeftMid), // TITLE
    xf(2, 0, 0, alignLeftMid), // SUBTITLE
    xf(3, 3, 1, alignCenter), // HEADER
    xf(0, 0, 1, alignWrapTop), // BODY
    xf(0, 4, 1, alignWrapTop), // BODY_ALT
    xf(4, 5, 1, alignWrapTop), // LABEL
    xf(2, 0, 0, alignLeftMid), // FOOTER
    xf(5, 0, 0, alignLeftMid), // COVER_TITLE
  ].join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="6">${fonts}</fonts><fills count="6">${fills}</fills><borders count="2">${borders}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="9">${cellXfs}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
}

function cell(ref: string, value: string, style: number): string {
  if (!value) return `<c r="${ref}" s="${style}"/>`;
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
}

function widthFor(values: string[]): number {
  let max = 10;
  for (const v of values) {
    const longest = String(v ?? "")
      .split("\n")
      .reduce((m, line) => Math.max(m, line.length), 0);
    max = Math.max(max, longest);
  }
  return Math.min(Math.max(max + 3, 12), 55);
}

function sheetXml(s: ReportSheet): string {
  const cols = Math.max(1, s.headers.length);
  const lastCol = colName(cols - 1);

  const rowsXml: string[] = [];
  let r = 0;

  // Dòng tiêu đề
  r++;
  rowsXml.push(
    `<row r="${r}" ht="30" customHeight="1">${Array.from({ length: cols }, (_, i) =>
      cell(`${colName(i)}${r}`, i === 0 ? s.title : "", S.TITLE),
    ).join("")}</row>`,
  );
  const merges: string[] = [`A1:${lastCol}1`];

  // Dòng phụ
  if (s.subtitle) {
    r++;
    rowsXml.push(
      `<row r="${r}" ht="18" customHeight="1">${Array.from({ length: cols }, (_, i) =>
        cell(`${colName(i)}${r}`, i === 0 ? s.subtitle! : "", S.SUBTITLE),
      ).join("")}</row>`,
    );
    merges.push(`A${r}:${lastCol}${r}`);
  }

  // Dòng trắng ngăn cách
  r++;
  rowsXml.push(`<row r="${r}" ht="6" customHeight="1"/>`);

  // Tiêu đề cột
  r++;
  const headerRow = r;
  rowsXml.push(
    `<row r="${r}" ht="24" customHeight="1">${s.headers
      .map((h, i) => cell(`${colName(i)}${r}`, h, S.HEADER))
      .join("")}</row>`,
  );

  // Dữ liệu
  const body = s.rows.length ? s.rows : [s.headers.map(() => "—")];
  body.forEach((row, ri) => {
    r++;
    const alt = ri % 2 === 1;
    const cells = s.headers.map((_, ci) => {
      const isLabel = s.kind === "fields" && ci === 0;
      const style = isLabel ? S.LABEL : alt ? S.BODY_ALT : S.BODY;
      return cell(`${colName(ci)}${r}`, String(row[ci] ?? ""), style);
    });
    rowsXml.push(`<row r="${r}">${cells.join("")}</row>`);
  });
  const lastDataRow = r;

  if (s.footer) {
    r++;
    r++;
    rowsXml.push(
      `<row r="${r}">${cell(`A${r}`, s.footer, S.FOOTER)}</row>`,
    );
    merges.push(`A${r}:${lastCol}${r}`);
  }

  const colsXml = s.headers
    .map((h, i) => {
      const values = [h, ...body.map((row) => String(row[i] ?? ""))];
      return `<col min="${i + 1}" max="${i + 1}" width="${widthFor(values)}" customWidth="1"/>`;
    })
    .join("");

  const freeze = `<sheetView showGridLines="0" workbookViewId="0"><pane ySplit="${headerRow}" topLeftCell="A${headerRow + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A${headerRow + 1}" sqref="A${headerRow + 1}"/></sheetView>`;

  const autoFilter =
    s.kind === "table" && s.rows.length
      ? `<autoFilter ref="A${headerRow}:${lastCol}${lastDataRow}"/>`
      : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${lastCol}${Math.max(r, 1)}"/><sheetViews>${freeze}</sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${colsXml}</cols><sheetData>${rowsXml.join("")}</sheetData>${autoFilter}<mergeCells count="${merges.length}">${merges
    .map((m) => `<mergeCell ref="${m}"/>`)
    .join("")}</mergeCells><pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>`;
}

function safeName(name: string, used: Set<string>): string {
  let n = (name || "Sheet").replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 31) || "Sheet";
  let i = 2;
  while (used.has(n.toLowerCase())) n = `${n.slice(0, 28)} ${i++}`;
  used.add(n.toLowerCase());
  return n;
}

export async function buildStyledWorkbook(sheets: ReportSheet[]): Promise<Uint8Array> {
  const { zipSync, strToU8 } = await import("fflate");
  const used = new Set<string>();
  const named = sheets.map((s) => ({ ...s, name: safeName(s.name, used) }));

  const files: Record<string, Uint8Array> = {};

  files["[Content_Types].xml"] = strToU8(
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${named
      .map(
        (_, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
      )
      .join("")}</Types>`,
  );

  files["_rels/.rels"] = strToU8(
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  );

  files["xl/workbook.xml"] = strToU8(
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${named
      .map(
        (s, i) =>
          `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
      )
      .join("")}</sheets></workbook>`,
  );

  files["xl/_rels/workbook.xml.rels"] = strToU8(
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${named
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join(
        "",
      )}<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
  );

  files["xl/styles.xml"] = strToU8(stylesXml());

  named.forEach((s, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(sheetXml(s));
  });

  return zipSync(files, { level: 6 });
}
