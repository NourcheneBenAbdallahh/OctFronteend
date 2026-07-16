import type { Alert, AlertSeverity, AlertStatus } from "@/lib/notifications.api";

export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  info: "Information",
  warning: "Attention",
  critical: "Urgent",
};

export const STATUS_LABELS: Record<AlertStatus, string> = {
  unread: "Non lue",
  read: "Lue",
  archived: "Archivée",
};

export const ALERT_TYPE_LABELS: Record<string, string> = {
  LOW_STOCK: "Stock faible",
  WAREHOUSE_CAPACITY_HIGH: "Capacité entrepôt élevée",
  INVENTORY_ANOMALY: "Anomalie inventaire",
  SUPPLIER_DELAY: "Retard fournisseur",
  COMMAND_DELAY: "Retard commande",
  CONTRACT_EXHAUSTED: "Contrat épuisé",
  CONTRACT_EXPIRED: "Contrat expiré",
  CONTRACT_EXPIRING: "Contrat expire bientôt",
  NEW_USER_PENDING: "Nouveau compte",
  ENTITY_CREATED: "Entité créée",
  STATUS_CHANGED: "Changement de statut",
  ENTITY_VALIDATED: "Validation",
};

export function getSeverityLabel(severity: AlertSeverity): string {
  return SEVERITY_LABELS[severity] ?? severity;
}

export function getStatusLabel(status: AlertStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function getAlertTypeLabel(type: string): string {
  return ALERT_TYPE_LABELS[type] ?? type.replace(/_/g, " ").toLowerCase();
}

const ENTITY_FOCUS_ROUTES: Record<string, string> = {
  commande: "/commandes",
  contrat: "/contrats",
  entrepot: "/entrepots",
  stock: "/stock",
  stock_inventaire: "/stock-inventaire",
  inventaire: "/stock-inventaire",
  mouvement: "/mouvements",
  mouvement_stock: "/mouvements",
  facture: "/factures",
  bon_livraison: "/bon-livraisons",
  user: "/users",
};

const LEGACY_PATH_ROUTES: Record<string, string> = {
  stocks: "/stock",
  stock: "/stock",
  commandes: "/commandes",
  contrats: "/contrats",
  entrepots: "/entrepots",
  "stock-inventaire": "/stock-inventaire",
  inventaires: "/stock-inventaire",
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

function normalizeEntityId(entityId?: string | number | null): string | number | null {
  if (entityId == null || entityId === "") return null;
  const raw = String(entityId);
  const clean = raw.split(":")[0];
  return clean === "" ? null : clean;
}

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
  const entityId = normalizeEntityId(alert.entity_id);

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
  return getAlertTypeLabel(type);
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

export function getAlertBusinessKey(alert: Alert): string {
  if (alert.entity_type && alert.entity_id != null) {
    return `${alert.type}|${alert.entity_type}|${alert.entity_id}`;
  }
  return `id|${alert.id}`;
}

export function dedupeAlerts(alerts: Alert[]): Alert[] {
  const byKey = new Map<string, Alert>();

  for (const alert of alerts) {
    const key = getAlertBusinessKey(alert);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, alert);
      continue;
    }

    const existingTime = new Date(existing.created_at ?? 0).getTime();
    const incomingTime = new Date(alert.created_at ?? 0).getTime();
    if (incomingTime >= existingTime) {
      byKey.set(key, alert);
    }
  }

  return Array.from(byKey.values()).sort((a, b) => {
    const aTime = new Date(a.created_at ?? 0).getTime();
    const bTime = new Date(b.created_at ?? 0).getTime();
    return bTime - aTime;
  });
}
