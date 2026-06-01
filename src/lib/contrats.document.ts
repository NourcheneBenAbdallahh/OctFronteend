import { getApiBaseUrl } from "@/lib/apiBase";
import { readPersistedAuthToken } from "@/lib/graphqlClient";

export type ContratDocumentDisposition = "inline" | "attachment";

export function getContratDocumentUrl(
  contratId: string | number,
  disposition: ContratDocumentDisposition = "inline"
): string {
  const base = getApiBaseUrl();
  const params = new URLSearchParams({ disposition });
  return `${base}/api/contrats/${contratId}/document?${params.toString()}`;
}

function parseFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      return utf8[1].trim();
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain?.[1]?.trim() ?? null;
}

function guessDocumentKind(
  mime: string,
  filename: string
): "pdf" | "image" | "other" {
  const lower = filename.toLowerCase();
  if (mime.includes("pdf") || lower.endsWith(".pdf")) return "pdf";
  if (mime.startsWith("image/") || /\.(jpe?g|png|gif|webp)$/i.test(lower)) return "image";
  return "other";
}

export async function fetchContratDocument(
  contratId: string | number,
  disposition: ContratDocumentDisposition = "inline",
  token?: string
): Promise<{ blob: Blob; filename: string; mime: string; kind: "pdf" | "image" | "other" }> {
  const bearer = token ?? readPersistedAuthToken();
  const url = getContratDocumentUrl(contratId, disposition);

  const res = await fetch(url, {
    headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error("Accès refusé au document. Reconnectez-vous ou vérifiez vos droits.");
  }
  if (res.status === 404) {
    throw new Error("Document introuvable pour ce contrat.");
  }
  if (!res.ok) {
    throw new Error("Impossible de charger le document du contrat.");
  }

  const blob = await res.blob();
  const filename =
    parseFilenameFromContentDisposition(res.headers.get("Content-Disposition")) ??
    `contrat-${contratId}`;
  const mime = blob.type || "application/octet-stream";

  return {
    blob,
    filename,
    mime,
    kind: guessDocumentKind(mime, filename),
  };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function openBlobInNewTab(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
