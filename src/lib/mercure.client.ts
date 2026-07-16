import type { Alert, AlertSeverity, AlertStatus } from "@/lib/notifications.api";

export const MERCURE_ALERT_TOPIC_BASE = "https://oct.tn/users";

export type MercureAlertEventType =
  | "alert.created"
  | "alert.updated"
  | "alert.read"
  | "alerts.all_read"
  | "alert.archived";

export type MercureAlertPayload = {
  event?: MercureAlertEventType;
  alert?: Partial<Alert> & { id?: string | number };
  alert_id?: string | number;
  unread_count?: number;
  // Legacy payloads (sans champ event)
  id?: string | number;
  title?: string;
  message?: string;
  type?: string;
  severity?: AlertSeverity;
  status?: AlertStatus;
  entity_type?: string | null;
  entity_id?: string | number | null;
  action_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export function getMercureHubUrl(): string | null {
  const hubUrl = process.env.NEXT_PUBLIC_MERCURE_HUB_URL?.trim();
  return hubUrl || null;
}

export function getUserAlertsTopic(userId: string | number): string {
  return `${MERCURE_ALERT_TOPIC_BASE}/${userId}/alerts`;
}

export function subscribeToUserAlerts(
  userId: string | number,
  onPayload: (payload: MercureAlertPayload) => void
): EventSource | null {
  const hubUrl = getMercureHubUrl();
  if (!hubUrl) return null;

  const topic = getUserAlertsTopic(userId);
  const subscribeUrl = `${hubUrl}?topic=${encodeURIComponent(topic)}`;
  const source = new EventSource(subscribeUrl);

  source.onmessage = (event) => {
    try {
      onPayload(JSON.parse(event.data) as MercureAlertPayload);
    } catch {
      // Ignore malformed Mercure payloads.
    }
  };

  return source;
}

export function normalizeMercureAlert(
  payload: MercureAlertPayload
): Alert | null {
  const raw = payload.alert ?? payload;
  if (!raw?.id) return null;

  const incomingId = String(raw.id);

  return {
    id: incomingId,
    type: (raw.type as Alert["type"]) ?? "LOW_STOCK",
    title: raw.title ?? "Nouvelle alerte",
    message: raw.message ?? "",
    severity: (raw.severity as AlertSeverity) ?? "info",
    status: (raw.status as AlertStatus) ?? "unread",
    entity_type: raw.entity_type ?? null,
    entity_id: raw.entity_id ?? null,
    action_url: raw.action_url ?? null,
    is_active: true,
    metadata: null,
    read_at: null,
    created_at: raw.created_at ?? new Date().toISOString(),
    updated_at: raw.updated_at ?? raw.created_at ?? new Date().toISOString(),
  };
}

export function resolveMercureEventType(
  payload: MercureAlertPayload
): MercureAlertEventType | "legacy.created" {
  if (payload.event) return payload.event;
  if (payload.id || payload.alert?.id) return "legacy.created";
  return "legacy.created";
}
