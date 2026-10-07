/**
 * Client-side image optimizer cho CMS.
 * - Resize theo preset (Hero / USP / CTA / Generic) để hiển thị đồng đều
 * - Nén sang WebP (fallback JPEG) để giảm dung lượng ~60-80%
 * - Tự bỏ qua SVG / GIF / file không phải ảnh
 */

export type ImagePreset = "hero" | "usp" | "cta" | "og" | "generic";

export type PresetSpec = {
  label: string;
  maxWidth: number;
  maxHeight: number;
  /** Nếu set → crop cover đúng tỷ lệ (dùng cho Hero/CTA/OG); nếu không → chỉ scale-down */
  ratio?: number;
  quality: number;
  format: "image/webp" | "image/jpeg";
};

export const PRESETS: Record<ImagePreset, PresetSpec> = {
  hero:    { label: "Hero (1920×1080)",   maxWidth: 1920, maxHeight: 1080, ratio: 16 / 9, quality: 0.82, format: "image/webp" },
  cta:     { label: "CTA (1600×900)",     maxWidth: 1600, maxHeight: 900,  ratio: 16 / 9, quality: 0.82, format: "image/webp" },
  usp:     { label: "USP / Icon (640×640)", maxWidth: 640, maxHeight: 640, ratio: 1,      quality: 0.86, format: "image/webp" },
  og:      { label: "OG image (1200×630)", maxWidth: 1200, maxHeight: 630, ratio: 1200 / 630, quality: 0.85, format: "image/jpeg" },
  generic: { label: "Chuẩn (max 1600px)",  maxWidth: 1600, maxHeight: 1600, quality: 0.85, format: "image/webp" },
};

const SKIP_MIMES = new Set(["image/svg+xml", "image/gif"]);

async function loadBitmap(file: File): Promise<{ bmp: ImageBitmap | null; img: HTMLImageElement | null; w: number; h: number }> {
  if ("createImageBitmap" in window) {
    try {
      const bmp = await createImageBitmap(file);
      return { bmp, img: null, w: bmp.width, h: bmp.height };
    } catch {
      /* fall through */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const el = new Image();
      el.onload = () => res(el);
      el.onerror = rej;
      el.src = url;
    });
    return { bmp: null, img, w: img.naturalWidth, h: img.naturalHeight };
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

export type OptimizedFile = {
  file: File;
  base64: string;
  width: number;
  height: number;
  mime: string;
  originalBytes: number;
  bytes: number;
  skipped: boolean;
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = () => rej(r.error);
    r.onload = () => {
      const s = String(r.result ?? "");
      const i = s.indexOf(",");
      res(i >= 0 ? s.slice(i + 1) : s);
    };
    r.readAsDataURL(blob);
  });
}

/**
 * Tối ưu 1 file theo preset. Nếu ảnh nhỏ hơn preset và đã <200KB, chỉ base64-hoá.
 * Trả về file mới với đuôi .webp/.jpg.
 */
export async function optimizeImage(file: File, preset: ImagePreset = "generic"): Promise<OptimizedFile> {
  const spec = PRESETS[preset];
  const origBytes = file.size;

  if (!file.type.startsWith("image/") || SKIP_MIMES.has(file.type)) {
    const base64 = await blobToBase64(file);
    return { file, base64, width: 0, height: 0, mime: file.type, originalBytes: origBytes, bytes: origBytes, skipped: true };
  }

  const { bmp, img, w: srcW, h: srcH } = await loadBitmap(file);

  // Tính kích thước đích
  let dstW = srcW;
  let dstH = srcH;
  let sx = 0, sy = 0, sw = srcW, sh = srcH;

  if (spec.ratio) {
    // Cover crop theo ratio
    const srcRatio = srcW / srcH;
    if (srcRatio > spec.ratio) {
      sw = Math.round(srcH * spec.ratio);
      sx = Math.round((srcW - sw) / 2);
    } else if (srcRatio < spec.ratio) {
      sh = Math.round(srcW / spec.ratio);
      sy = Math.round((srcH - sh) / 2);
    }
    dstW = Math.min(spec.maxWidth, sw);
    dstH = Math.round(dstW / spec.ratio);
  } else {
    const scale = Math.min(1, spec.maxWidth / srcW, spec.maxHeight / srcH);
    dstW = Math.max(1, Math.round(srcW * scale));
    dstH = Math.max(1, Math.round(srcH * scale));
  }

  const canvas = document.createElement("canvas");
  canvas.width = dstW;
  canvas.height = dstH;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (bmp) ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, dstW, dstH);
  else if (img) ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dstW, dstH);

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, spec.format, spec.quality));
  if (!blob) {
    // Fallback: giữ file gốc
    const base64 = await blobToBase64(file);
    return { file, base64, width: srcW, height: srcH, mime: file.type, originalBytes: origBytes, bytes: origBytes, skipped: true };
  }

  const ext = spec.format === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^./\\]+$/, "");
  const newFile = new File([blob], `${baseName}.${ext}`, { type: spec.format });
  const base64 = await blobToBase64(blob);
  bmp?.close?.();

  return {
    file: newFile,
    base64,
    width: dstW,
    height: dstH,
    mime: spec.format,
    originalBytes: origBytes,
    bytes: blob.size,
    skipped: false,
  };
}

export async function optimizeMany(files: File[], preset: ImagePreset): Promise<OptimizedFile[]> {
  return Promise.all(files.map((f) => optimizeImage(f, preset)));
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}
