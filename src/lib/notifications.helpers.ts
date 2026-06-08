import type { Alert } from "@/lib/notifications.api";

const ENTITY_FOCUS_ROUTES: Record<string, string> = {
  commande: "/commandes",
  contrat: "/contrats",
  entrepot: "/entrepots",
  stock: "/stock",
  stock_inventaire: "/stock-inventaire",
  mouvement: "/mouvements",
  mouvement_stock: "/mouvements",
  user: "/users",
};

const LEGACY_PATH_ROUTES: Record<string, string> = {
  stocks: "/stock",
  stock: "/stock",
  commandes: "/commandes",
  contrats: "/contrats",
  entrepots: "/entrepots",
  "stock-inventaire": "/stock-inventaire",
  "bon-livraisons": "/bon-livraisons",
  factures: "/factures",
  mouvements: "/mouvements",
  users: "/users",
};

const ALERT_TYPE_ROUTES: Partial<Record<string, string>> = {
  COMMAND_DELAY: "/commandes",
  SUPPLIER_DELAY: "/commandes",
  CONTRACT_EXHAUSTED: "/contrats",
  CONTRACT_EXPIRED: "/contrats",
  CONTRACT_EXPIRING: "/contrats",
  WAREHOUSE_CAPACITY_HIGH: "/entrepots",
  WAREHOUSE_CAPACITY_CRITICAL: "/entrepots",
  LOW_STOCK: "/stock",
  INVENTORY_ANOMALY: "/stock-inventaire",
  NEW_USER_PENDING: "/users",
};

function buildFocusUrl(basePath: string, entityId: string | number): string {
  return `${basePath}?focus=${encodeURIComponent(String(entityId))}`;
}

function resolveLegacyPath(pathKey: string): string {
  return LEGACY_PATH_ROUTES[pathKey] ?? `/${pathKey}`;
}

function resolveEntityRoute(
  entityType?: string | null,
  entityId?: string | number | null
): string | null {
  const normalizedType = (entityType || "").trim().toLowerCase();
  if (!normalizedType || entityId == null || entityId === "") return null;

  const basePath = ENTITY_FOCUS_ROUTES[normalizedType];
  if (!basePath) return null;

  return buildFocusUrl(basePath, entityId);
}

function resolveTypeRoute(
  alertType?: string | null,
  entityId?: string | number | null
): string | null {
  const normalizedType = (alertType || "").trim().toUpperCase();
  if (!normalizedType) return null;

  const basePath = ALERT_TYPE_ROUTES[normalizedType];
  if (!basePath) return null;

  if (entityId != null && entityId !== "") {
    return buildFocusUrl(basePath, entityId);
  }

  return basePath;
}

export function getSafeAlertUrl(alert: Alert): string | null {
  const rawUrl = (alert.action_url || "").trim();
  const entityId = alert.entity_id;

  if (rawUrl) {
    if (rawUrl.includes("focus=")) {
      return rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
    }

    if (rawUrl.startsWith("/admin/(others-pages)/")) {
      const legacy = rawUrl.replace("/admin/(others-pages)/", "");
      const [pathKey, maybeId] = legacy.split("/").filter(Boolean);

      if (!pathKey) return "/notifications";

      const basePath = resolveLegacyPath(pathKey);
      if (maybeId && /^\d+$/.test(maybeId)) {
        return buildFocusUrl(basePath, maybeId);
      }
      if (entityId != null && entityId !== "") {
        return buildFocusUrl(basePath, entityId);
      }
      return basePath;
    }

    const pathWithId = rawUrl.match(/^(\/[^?#]+)\/(\d+)$/);
    if (pathWithId) {
      return buildFocusUrl(pathWithId[1], pathWithId[2]);
    }

    if (entityId != null && entityId !== "" && !rawUrl.includes("?")) {
      const fromEntity = resolveEntityRoute(alert.entity_type, entityId);
      if (fromEntity) return fromEntity;
    }

    return rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
  }

  const fromEntity = resolveEntityRoute(alert.entity_type, entityId);
  if (fromEntity) return fromEntity;

  return resolveTypeRoute(alert.type, entityId);
}

export function hasAlertTarget(alert: Alert): boolean {
  return getSafeAlertUrl(alert) != null;
}

export function navigateToAlert(
  alert: Alert,
  router: { push: (url: string) => void }
): boolean {
  const targetUrl = getSafeAlertUrl(alert);
  if (!targetUrl) return false;
  router.push(targetUrl);
  return true;
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
  if (hasAlertTarget(alert)) return "Voir";
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
