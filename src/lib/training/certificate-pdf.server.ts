import type { PDFFont } from "pdf-lib";

// pdf-lib + @pdf-lib/fontkit are CJS with tslib helpers; evaluating them at
// module scope in the Worker bundle throws "Cannot destructure property
// '__extends' of '__toESM(...).default'" and takes down every SSR request that
// shares the chunk. Load them lazily, only when a PDF is actually generated.
async function loadPdfLibs() {
  const [pdfLibNs, fontkitNs] = await Promise.all([
    import("pdf-lib"),
    import("@pdf-lib/fontkit"),
  ]);
  const pdfLib: any = (pdfLibNs as any).default ?? pdfLibNs;
  const fontkit: any = (fontkitNs as any).default ?? fontkitNs;
  return { PDFDocument: pdfLib.PDFDocument, rgb: pdfLib.rgb, degrees: pdfLib.degrees, fontkit };
}


const FONT_REGULAR_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/BeVietnamPro-Regular.ttf";
const FONT_BOLD_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/BeVietnamPro-Bold.ttf";
const FONT_ITALIC_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/BeVietnamPro-Italic.ttf";

let fontCache: { regular: ArrayBuffer; bold: ArrayBuffer; italic: ArrayBuffer } | null = null;

async function loadFonts() {
  if (fontCache) return fontCache;
  const [r, b, i] = await Promise.all([
    fetch(FONT_REGULAR_URL).then((res) => res.arrayBuffer()),
    fetch(FONT_BOLD_URL).then((res) => res.arrayBuffer()),
    fetch(FONT_ITALIC_URL).then((res) => res.arrayBuffer()),
  ]);
  fontCache = { regular: r, bold: b, italic: i };
  return fontCache;
}

export async function generateCertificatePdf(opts: {
  recipientName: string;
  title: string;
  certificateNumber: string;
  verifyCode: string;
  issuedAt: Date;
  signatureUrl?: string;
}): Promise<Uint8Array> {
  const { PDFDocument, rgb, degrees, fontkit } = await loadPdfLibs();
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fonts = await loadFonts();

  const page = pdf.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();

  const font: PDFFont = await pdf.embedFont(fonts.regular, { subset: true });
  const fontBold: PDFFont = await pdf.embedFont(fonts.bold, { subset: true });
  const fontItalic: PDFFont = await pdf.embedFont(fonts.italic, { subset: true });

  const red = rgb(0.86, 0.15, 0.15);
  const dark = rgb(0.1, 0.1, 0.15);
  const gold = rgb(0.83, 0.68, 0.21);
  const gray = rgb(0.4, 0.4, 0.45);

  // Outer border
  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: red, borderWidth: 3 });
  page.drawRectangle({ x: 36, y: 36, width: width - 72, height: height - 72, borderColor: gold, borderWidth: 1 });

  // Header band
  page.drawRectangle({ x: 36, y: height - 110, width: width - 72, height: 60, color: red, opacity: 0.92 });
  page.drawText("KAIZEN MANPOWER", {
    x: width / 2 - fontBold.widthOfTextAtSize("KAIZEN MANPOWER", 28) / 2,
    y: height - 90, size: 28, font: fontBold, color: rgb(1, 1, 1),
  });

  const subtitle = "CÔNG TY CỔ PHẦN KAIZEN";
  page.drawText(subtitle, {
    x: width / 2 - font.widthOfTextAtSize(subtitle, 11) / 2,
    y: height - 105, size: 11, font, color: rgb(1, 1, 1),
  });

  // Title
  const titleText = "CHỨNG NHẬN HOÀN THÀNH";
  page.drawText(titleText, {
    x: width / 2 - fontBold.widthOfTextAtSize(titleText, 36) / 2,
    y: height - 170, size: 36, font: fontBold, color: dark,
  });

  const sub2 = "CERTIFICATE OF COMPLETION";
  page.drawText(sub2, {
    x: width / 2 - fontItalic.widthOfTextAtSize(sub2, 14) / 2,
    y: height - 195, size: 14, font: fontItalic, color: gray,
  });

  // Body
  const intro = "Chứng nhận rằng";
  page.drawText(intro, {
    x: width / 2 - font.widthOfTextAtSize(intro, 14) / 2,
    y: height - 245, size: 14, font, color: dark,
  });

  // Recipient name (large)
  const name = opts.recipientName.toUpperCase();
  const nameSize = 32;
  page.drawText(name, {
    x: width / 2 - fontBold.widthOfTextAtSize(name, nameSize) / 2,
    y: height - 295, size: nameSize, font: fontBold, color: red,
  });
  const nameWidth = fontBold.widthOfTextAtSize(name, nameSize);
  page.drawLine({
    start: { x: width / 2 - nameWidth / 2 - 20, y: height - 305 },
    end: { x: width / 2 + nameWidth / 2 + 20, y: height - 305 },
    thickness: 1, color: gold,
  });

  // Program title
  const completedText = "đã hoàn thành xuất sắc chương trình";
  page.drawText(completedText, {
    x: width / 2 - font.widthOfTextAtSize(completedText, 14) / 2,
    y: height - 335, size: 14, font, color: dark,
  });
  const t = opts.title;
  const tSize = 18;
  const wrap = (text: string, maxWidth: number) => {
    const words = text.split(/\s+/);
    const lines: string[] = []; let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (fontBold.widthOfTextAtSize(test, tSize) > maxWidth) { if (cur) lines.push(cur); cur = w; } else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  };
  const lines = wrap(t, width - 200);
  lines.forEach((ln, i) => {
    page.drawText(ln, {
      x: width / 2 - fontBold.widthOfTextAtSize(ln, tSize) / 2,
      y: height - 365 - i * 24, size: tSize, font: fontBold, color: dark,
    });
  });

  // Footer info
  const issuedDate = opts.issuedAt.toLocaleDateString("vi-VN");
  const leftX = 100, rightX = width - 300, footerY = 130;
  page.drawText("Ngày cấp:", { x: leftX, y: footerY + 20, size: 10, font, color: gray });
  page.drawText(issuedDate, { x: leftX, y: footerY, size: 12, font: fontBold, color: dark });

  page.drawText("Số chứng nhận:", { x: leftX, y: footerY - 30, size: 10, font, color: gray });
  page.drawText(opts.certificateNumber, { x: leftX, y: footerY - 48, size: 12, font: fontBold, color: dark });

  // Signature line
  page.drawLine({ start: { x: rightX, y: footerY + 15 }, end: { x: rightX + 200, y: footerY + 15 }, thickness: 1, color: dark });
  page.drawText("Giám đốc điều hành", { x: rightX + 30, y: footerY, size: 11, font, color: gray });
  page.drawText("KAIZEN MANPOWER", { x: rightX + 25, y: footerY - 16, size: 11, font: fontBold, color: dark });

  // Verify code badge
  const verifyLine = `Verify: kaizenmanpower.com/verify/${opts.verifyCode}`;
  page.drawText(verifyLine, {
    x: width / 2 - font.widthOfTextAtSize(verifyLine, 9) / 2,
    y: 60, size: 9, font, color: gray,
  });

  // Watermark diagonal
  page.drawText("KAIZEN", {
    x: width / 2 - 180, y: height / 2 - 50,
    size: 120, font: fontBold, color: red, opacity: 0.04, rotate: degrees(-30),
  });

  return await pdf.save();
}
