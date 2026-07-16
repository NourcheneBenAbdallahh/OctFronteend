"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getAlerts,
  getUnreadAlertsCount,
  markAlertAsRead,
  markAllAlertsAsRead,
  archiveAlert,
  type Alert,
} from "@/lib/notifications.api";
import {
  normalizeMercureAlert,
  resolveMercureEventType,
  subscribeToUserAlerts,
  type MercureAlertPayload,
} from "@/lib/mercure.client";
import { useAuthStore } from "@/store/useAuthStore";
import { playNotificationSound } from "@/lib/notificationSound";
import { dedupeAlerts } from "@/lib/notifications.helpers";

type Options = {
  onNewAlert?: (alert: Alert) => void;
};

export function useLiveAlerts(options: Options = {}) {
  const { onNewAlert } = options;

  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.user?.id);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const knownAlertIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);
  const onNewAlertRef = useRef(onNewAlert);

  useEffect(() => {
    onNewAlertRef.current = onNewAlert;
  }, [onNewAlert]);

  const notifyIfNew = useCallback((alert: Alert, options?: { force?: boolean; reshow?: boolean }) => {
    const id = String(alert.id);
    if (!options?.reshow && knownAlertIdsRef.current.has(id)) return;
    knownAlertIdsRef.current.add(id);
    if (!options?.force && !initialLoadDoneRef.current) return;
    onNewAlertRef.current?.(alert);
    void playNotificationSound();
  }, []);

  const loadAlerts = useCallback(async () => {
    try {
      const [alertsData, unreadData] = await Promise.all([
        getAlerts(),
        getUnreadAlertsCount(),
      ]);

      if (!initialLoadDoneRef.current) {
        alertsData.forEach((alert) => knownAlertIdsRef.current.add(String(alert.id)));
        initialLoadDoneRef.current = true;
      }

      setAlerts(dedupeAlerts(alertsData));
      setUnreadCount(unreadData);
    } catch (error) {
      console.error("Erreur lors du chargement des alertes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setAlerts([]);
    setUnreadCount(0);
    knownAlertIdsRef.current = new Set();
    initialLoadDoneRef.current = false;

    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    void loadAlerts();
  }, [token, loadAlerts]);

  const applyMercurePayload = useCallback(
    (payload: MercureAlertPayload) => {
      const eventType = resolveMercureEventType(payload);

      switch (eventType) {
        case "alert.created":
        case "alert.updated":
        case "legacy.created": {
          const incoming = normalizeMercureAlert(payload);
          if (!incoming) return;

          setAlerts((prev) => {
            const index = prev.findIndex((a) => String(a.id) === incoming.id);
            const businessKey = incoming.entity_type && incoming.entity_id != null
              ? `${incoming.type}|${incoming.entity_type}|${incoming.entity_id}`
              : null;

            if (index >= 0) {
              const next = [...prev];
              next[index] = { ...next[index], ...incoming };
              return next;
            }

            if (businessKey) {
              const dupIndex = prev.findIndex(
                (a) =>
                  a.type === incoming.type &&
                  a.entity_type === incoming.entity_type &&
                  String(a.entity_id) === String(incoming.entity_id)
              );
              if (dupIndex >= 0) {
                const next = [...prev];
                next[dupIndex] = { ...next[dupIndex], ...incoming };
                return next;
              }
            }

            return dedupeAlerts([incoming, ...prev]);
          });

          if (eventType === "alert.created" || eventType === "legacy.created") {
            if (typeof payload.unread_count === "number") {
              setUnreadCount(payload.unread_count);
            } else {
              setUnreadCount((prev) => prev + 1);
            }
            notifyIfNew(incoming, { force: true });
          } else if (eventType === "alert.updated" && incoming.status === "unread") {
            notifyIfNew(incoming, { force: true, reshow: true });
          }
          break;
        }
        case "alert.read": {
          const alertId = String(payload.alert_id ?? payload.alert?.id ?? "");
          if (!alertId) return;

          setAlerts((prev) =>
            prev.map((alert) =>
              String(alert.id) === alertId
                ? {
                    ...alert,
                    status: "read" as const,
                    read_at: new Date().toISOString(),
                    ...(payload.alert ? normalizeMercureAlert(payload) ?? {} : {}),
                  }
                : alert
            )
          );
          if (typeof payload.unread_count === "number") {
            setUnreadCount(payload.unread_count);
          } else {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
          break;
        }
        case "alerts.all_read": {
          setUnreadCount(typeof payload.unread_count === "number" ? payload.unread_count : 0);
          setAlerts((prev) =>
            prev.map((alert) => ({
              ...alert,
              status: "read",
              read_at: alert.read_at ?? new Date().toISOString(),
            }))
          );
          break;
        }
        case "alert.archived": {
          const alertId = String(payload.alert_id ?? payload.alert?.id ?? "");
          if (!alertId) return;
          setAlerts((prev) =>
            prev.map((alert) =>
              String(alert.id) === alertId
                ? { ...alert, status: "archived" as const, is_active: false }
                : alert
            )
          );
          break;
        }
        default:
          break;
      }
    },
    [notifyIfNew]
  );

  useEffect(() => {
    if (!token || !userId) return;

    const source = subscribeToUserAlerts(userId, applyMercurePayload);
    if (!source) return;

    return () => source.close();
  }, [token, userId, applyMercurePayload]);

  const handleMarkAsRead = useCallback(async (alertId: string) => {
    try {
      await markAlertAsRead(alertId);
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId
            ? { ...alert, status: "read" as const, read_at: new Date().toISOString() }
            : alert
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erreur lors du marquage comme lu:", error);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAlertsAsRead();
      setUnreadCount(0);
      setAlerts((prev) =>
        prev.map((alert) => ({
          ...alert,
          status: "read",
          read_at: alert.read_at ?? new Date().toISOString(),
        }))
      );
    } catch (error) {
      console.error("Erreur lors du marquage global comme lu:", error);
    }
  }, []);

  const handleArchive = useCallback(async (alertId: string) => {
    try {
      await archiveAlert(alertId);
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId
            ? { ...alert, status: "archived" as const, is_active: false }
            : alert
        )
      );
    } catch (error) {
      console.error("Erreur lors de l'archivage:", error);
    }
  }, []);

  const refreshAlerts = useCallback(async () => {
    setLoading(true);
    await loadAlerts();
  }, [loadAlerts]);

  return {
    alerts,
    unreadCount,
    loading,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    archiveAlert: handleArchive,
    refreshAlerts,
  };
}
