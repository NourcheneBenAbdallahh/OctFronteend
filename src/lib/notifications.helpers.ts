import type { Alert } from "@/lib/notifications.api";

const ENTITY_FOCUS_ROUTES: Record<string, string> = {
  contrat: "/contrats",
  commande: "/commandes",
  entrepot: "/entrepots",
  stock: "/stock",
  stock_inventaire: "/stock-inventaire",
};

function buildFocusUrl(basePath: string, entityId: string | number): string {
  return `${basePath}?focus=${encodeURIComponent(String(entityId))}`;
}

export function getSafeAlertUrl(alert: Alert): string | null {
  const rawUrl = (alert.action_url || "").trim();

  if (!rawUrl) {
    const entityType = (alert.entity_type || "").trim().toLowerCase();
    const entityId = alert.entity_id;
    if (entityType && entityId != null && entityId !== "") {
      const basePath = ENTITY_FOCUS_ROUTES[entityType];
      if (basePath) return buildFocusUrl(basePath, entityId);
    }
    return null;
  }

  if (rawUrl.startsWith("/admin/(others-pages)/")) {
    const legacy = rawUrl.replace("/admin/(others-pages)/", "/");
    const [legacyPath, maybeId] = legacy.split("/").filter(Boolean);

    if (!legacyPath) return "/notifications";
    if (maybeId && /^\d+$/.test(maybeId)) {
      return buildFocusUrl(`/${legacyPath}`, maybeId);
    }
    return `/${legacyPath}`;
  }

  const pathWithId = rawUrl.match(/^(\/[^?#]+)\/(\d+)$/);
  if (pathWithId) {
    return buildFocusUrl(pathWithId[1], pathWithId[2]);
  }

  return rawUrl;
}

export function formatAlertType(type: Alert["type"]): string {
  if (type === "NEW_USER_PENDING") return "Nouveau compte";
  return type.replace(/_/g, " ").toLowerCase();
}

export function getAlertSeverityAccent(severity: Alert["severity"]): string {
  switch (severity) {
    case "critical":
      return "border-red-500 bg-red-50";
    case "warning":
      return "border-amber-500 bg-amber-50";
    case "info":
    default:
      return "border-[#00A09D] bg-emerald-50";
  }
}

export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return "À l'instant";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return "À l'instant";

  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return "À l'instant";

  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) {
    return `Il y a ${diffMins} min`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `Il y a ${diffHours} h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays} j`;
}

export function getAlertCtaLabel(alert: Alert): string {
  if (alert.type === "NEW_USER_PENDING") return "Activer";
  if (alert.action_url) return "Voir";
  return "Ouvrir";
}

export function getAlertIconTone(severity: Alert["severity"]): string {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-600";
    case "warning":
      return "bg-amber-100 text-amber-600";
    case "info":
    default:
      return "bg-emerald-100 text-[#00A09D]";
  }
}

export function getAlertCtaTone(severity: Alert["severity"]): string {
  switch (severity) {
    case "critical":
      return "bg-red-600 hover:bg-red-700";
    case "warning":
      return "bg-amber-500 hover:bg-amber-600";
    case "info":
    default:
      return "bg-[#00A09D] hover:bg-[#008f8c]";
  }
}
