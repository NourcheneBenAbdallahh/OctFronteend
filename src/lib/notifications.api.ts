import { graphqlRequest } from "@/lib/graphqlClient";

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "unread" | "read" | "archived";

export type AlertType =
  | "LOW_STOCK"
  | "WAREHOUSE_CAPACITY_HIGH"
  | "INVENTORY_ANOMALY"
  | "SUPPLIER_DELAY";

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  entity_type?: string | null;
  entity_id?: string | number | null;
  action_url?: string | null;
  is_active: boolean;
  metadata?: Record<string, any> | null;
  read_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

const GET_ALERTS_QUERY = `
  query GetAlerts {
    alerts {
      id
      type
      title
      message
      severity
      status
      entity_type
      entity_id
      action_url
      is_active
      read_at
      created_at
      updated_at
    }
  }
`;

const GET_UNREAD_ALERTS_COUNT_QUERY = `
  query GetUnreadAlertsCount {
    unreadAlertsCount
  }
`;

const MARK_ALERT_AS_READ_MUTATION = `
  mutation MarkAlertAsRead($id: ID!) {
    markAlertAsRead(id: $id, is_read: true) {
      id
      status
      read_at
    }
  }
`;

const MARK_ALL_ALERTS_AS_READ_MUTATION = `
  mutation MarkAllAlertsAsRead {
    markAllAlertsAsRead
  }
`;

const ARCHIVE_ALERT_MUTATION = `
  mutation ArchiveAlert($id: ID!) {
    archiveAlert(id: $id) {
      id
      status
    }
  }
`;

export async function getAlerts(): Promise<Alert[]> {
  return graphqlRequest<{ alerts: Alert[] }>(GET_ALERTS_QUERY, {}).then(
    (d) => d.alerts ?? []
  );
}

export async function getUnreadAlertsCount(): Promise<number> {
  return graphqlRequest<{ unreadAlertsCount: number }>(
    GET_UNREAD_ALERTS_COUNT_QUERY,
    {}
  ).then((d) => d.unreadAlertsCount ?? 0);
}

export async function markAlertAsRead(id: string) {
  return graphqlRequest<{
    markAlertAsRead: {
      id: string;
      status: AlertStatus;
      read_at?: string | null;
    };
  }>(MARK_ALERT_AS_READ_MUTATION, { id }).then((d) => d.markAlertAsRead);
}

export async function markAllAlertsAsRead() {
  return graphqlRequest<{ markAllAlertsAsRead: boolean }>(
    MARK_ALL_ALERTS_AS_READ_MUTATION,
    {}
  ).then((d) => d.markAllAlertsAsRead);
}

export async function archiveAlert(id: string) {
  return graphqlRequest<{
    archiveAlert: {
      id: string;
      status: AlertStatus;
    };
  }>(ARCHIVE_ALERT_MUTATION, { id }).then((d) => d.archiveAlert);
}