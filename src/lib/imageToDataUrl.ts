const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Impossible de lire le fichier image."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Impossible de charger l'image."));
    img.src = src;
  });
}

export async function fileToProfilePhotoDataUrl(
  file: File,
  maxDimension = 256,
  quality = 0.85
): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("Format non supporté. Utilisez JPG, PNG ou WebP.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("L'image est trop volumineuse (max 5 Mo).");
  }

  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Impossible de traiter l'image.");
  }

  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

export function isDisplayablePhoto(src?: string | null): src is string {
  return !!src && (src.startsWith("http") || src.startsWith("data:image") || src.startsWith("/"));
}
