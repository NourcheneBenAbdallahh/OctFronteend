"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getAlerts,
  getUnreadAlertsCount,
  markAlertAsRead,
  markAllAlertsAsRead,
  type Alert,
  type AlertSeverity,
} from "@/lib/notifications.api";
import { useAuthStore } from "@/store/useAuthStore";
import { playNotificationSound } from "@/lib/notificationSound";

type Options = {
  onNewAlert?: (alert: Alert) => void;
  pollWhenClosedMs?: number;
  pollWhenOpenMs?: number;
  isDropdownOpen?: boolean;
};

function normalizeMercureAlert(payload: Partial<Alert> & { id?: string | number }): Alert | null {
  if (!payload.id) return null;
  const incomingId = String(payload.id);
  return {
    id: incomingId,
    type: (payload.type as Alert["type"]) ?? "LOW_STOCK",
    title: payload.title ?? "Nouvelle alerte",
    message: payload.message ?? "",
    severity: (payload.severity as AlertSeverity) ?? "info",
    status: (payload.status as Alert["status"]) ?? "unread",
    entity_type: payload.entity_type ?? null,
    entity_id: payload.entity_id ?? null,
    action_url: payload.action_url ?? null,
    is_active: true,
    metadata: null,
    read_at: null,
    created_at: payload.created_at ?? new Date().toISOString(),
    updated_at: payload.updated_at ?? payload.created_at ?? new Date().toISOString(),
  };
}

export function useLiveAlerts(options: Options = {}) {
  const {
    onNewAlert,
    pollWhenClosedMs = 5000,
    pollWhenOpenMs = 3000,
    isDropdownOpen = false,
  } = options;

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

  const notifyIfNew = useCallback((alert: Alert, options?: { force?: boolean }) => {
    const id = String(alert.id);
    if (knownAlertIdsRef.current.has(id)) return;
    knownAlertIdsRef.current.add(id);
    if (!options?.force && !initialLoadDoneRef.current) return;
    onNewAlertRef.current?.(alert);
    void playNotificationSound();
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
  }, [token]);

  useEffect(() => {
    if (!token) return;

    setLoading(true);

    const loadAlerts = async () => {
      try {
        const [alertsData, unreadData] = await Promise.all([
          getAlerts(),
          getUnreadAlertsCount(),
        ]);

        if (!initialLoadDoneRef.current) {
          alertsData.forEach((alert) => knownAlertIdsRef.current.add(String(alert.id)));
          initialLoadDoneRef.current = true;
        } else {
          alertsData.forEach((alert) => {
            if (alert.status === "unread") {
              notifyIfNew(alert);
            }
          });
        }

        setAlerts(alertsData);
        setUnreadCount(unreadData);
      } catch (error) {
        console.error("Erreur lors du chargement des alertes:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadAlerts();
    const pollMs = isDropdownOpen ? pollWhenOpenMs : pollWhenClosedMs;
    const timer = window.setInterval(loadAlerts, pollMs);

    return () => window.clearInterval(timer);
  }, [token, isDropdownOpen, pollWhenClosedMs, pollWhenOpenMs, notifyIfNew]);

  useEffect(() => {
    if (!token || !userId) return;
    const hubUrl = process.env.NEXT_PUBLIC_MERCURE_HUB_URL;
    if (!hubUrl) return;

    const topic = `https://oct.tn/users/${userId}/alerts`;
    const subscribeUrl = `${hubUrl}?topic=${encodeURIComponent(topic)}`;
    const source = new EventSource(subscribeUrl);

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as Partial<Alert> & { id?: string | number };
        const incoming = normalizeMercureAlert(payload);
        if (!incoming) return;

        setAlerts((prev) => {
          if (prev.some((a) => String(a.id) === incoming.id)) {
            return prev;
          }
          return [incoming, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
        notifyIfNew(incoming, { force: true });
      } catch {
        // Ignore malformed mercure payloads.
      }
    };

    return () => source.close();
  }, [token, userId, notifyIfNew]);

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

  return {
    alerts,
    unreadCount,
    loading,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
  };
}
