"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLiveAlerts } from "@/hooks/useLiveAlerts";
import type { Alert } from "@/lib/notifications.api";
import { primeNotificationSound } from "@/lib/notificationSound";

type LiveAlertsContextValue = {
  alerts: Alert[];
  unreadCount: number;
  loading: boolean;
  isDropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
  markAsRead: (alertId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveAlert: (alertId: string) => Promise<void>;
  refreshAlerts: () => Promise<void>;
  subscribeNewAlert: (listener: (alert: Alert) => void) => () => void;
};

const LiveAlertsContext = createContext<LiveAlertsContextValue | null>(null);

export function LiveAlertsProvider({ children }: { children: ReactNode }) {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const listenersRef = useRef(new Set<(alert: Alert) => void>());

  const notifyListeners = useCallback((alert: Alert) => {
    listenersRef.current.forEach((listener) => listener(alert));
  }, []);

  const alertsState = useLiveAlerts({
    onNewAlert: notifyListeners,
  });

  const subscribeNewAlert = useCallback((listener: (alert: Alert) => void) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  useEffect(() => {
    const prime = () => primeNotificationSound();
    window.addEventListener("pointerdown", prime, { once: true });
    window.addEventListener("keydown", prime, { once: true });
    return () => {
      window.removeEventListener("pointerdown", prime);
      window.removeEventListener("keydown", prime);
    };
  }, []);

  const value = useMemo(
    () => ({
      ...alertsState,
      isDropdownOpen,
      setDropdownOpen,
      subscribeNewAlert,
    }),
    [alertsState, isDropdownOpen, subscribeNewAlert]
  );

  return (
    <LiveAlertsContext.Provider value={value}>{children}</LiveAlertsContext.Provider>
  );
}

export function useLiveAlertsContext() {
  const context = useContext(LiveAlertsContext);
  if (!context) {
    throw new Error("useLiveAlertsContext must be used within LiveAlertsProvider");
  }
  return context;
}
