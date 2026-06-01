import type jsPDF from "jspdf";

type CachedLogo = {
  dataUrl: string;
  width: number;
  height: number;
  format: "PNG" | "JPEG" | "WEBP";
} | null;

let cachedLogo: CachedLogo | undefined;

const MAX_LOGO_WIDTH_MM = 28;
const MAX_LOGO_HEIGHT_MM = 22;

function dataUrlFormat(dataUrl: string): "PNG" | "JPEG" | "WEBP" {
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) {
    return "JPEG";
  }
  if (dataUrl.startsWith("data:image/webp")) return "WEBP";
  return "PNG";
}

function fitLogoMm(
  naturalW: number,
  naturalH: number
): { widthMm: number; heightMm: number } {
  if (!naturalW || !naturalH) {
    return { widthMm: MAX_LOGO_WIDTH_MM, heightMm: MAX_LOGO_HEIGHT_MM };
  }
  const ratio = naturalW / naturalH;
  let widthMm = MAX_LOGO_WIDTH_MM;
  let heightMm = widthMm / ratio;
  if (heightMm > MAX_LOGO_HEIGHT_MM) {
    heightMm = MAX_LOGO_HEIGHT_MM;
    widthMm = heightMm * ratio;
  }
  return { widthMm, heightMm };
}

function measureDataUrl(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("logo load failed"));
    img.src = dataUrl;
  });
}

async function loadLogo(): Promise<CachedLogo> {
  if (cachedLogo !== undefined) return cachedLogo;
  if (typeof window === "undefined") {
    cachedLogo = null;
    return null;
  }

  try {
    const res = await fetch("/images/logo/logoOCT.png");
    if (!res.ok) {
      cachedLogo = null;
      return null;
    }
    const blob = await res.blob();
    const dataUrl = await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
    if (!dataUrl) {
      cachedLogo = null;
      return null;
    }
    const { width, height } = await measureDataUrl(dataUrl);
    cachedLogo = {
      dataUrl,
      width,
      height,
      format: dataUrlFormat(dataUrl),
    };
  } catch {
    cachedLogo = null;
  }

  return cachedLogo;
}

/** En-tête PDF OCT avec logo et lignes institutionnelles. Retourne la position Y suivante. */
export async function drawOctPdfHeader(
  doc: jsPDF,
  title: string,
  startY = 12
): Promise<number> {
  const logo = await loadLogo();
  let y = startY;

  if (logo) {
    const { widthMm, heightMm } = fitLogoMm(logo.width, logo.height);
    doc.addImage(logo.dataUrl, logo.format, 14, y, widthMm, heightMm);
    y += heightMm + 4;
  }

  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text("Office du Commerce de la Tunisie", 14, y);
  y += 5;
  doc.text("Direction d'Exploitation et Suivi des Sous-Traitants", 14, y);
  y += 5;
  doc.text("Sous Direction de Gestion du Stock et Suivi des Sous-Traitants", 14, y);
  y += 8;

  doc.setFontSize(14);
  doc.setTextColor(28, 36, 52);
  doc.text(title, 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  return y;
}
