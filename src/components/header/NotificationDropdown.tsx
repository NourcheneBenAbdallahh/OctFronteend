"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { getAlerts, getUnreadAlertsCount, markAlertAsRead, markAllAlertsAsRead, Alert, AlertSeverity } from "@/lib/notifications.api";
import { useAuthStore } from "@/store/useAuthStore";

export default function NotificationDropdown() {
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.user?.id);
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const prevUnreadCountRef = useRef(0);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleClick = () => {
    toggleDropdown();
  };

  // Charger les données des alertes
  useEffect(() => {
    // Recharger à chaque changement d'utilisateur/token
    setAlerts([]);
    setUnreadCount(0);
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const loadAlerts = async () => {
      try {
        const [alertsData, unreadData] = await Promise.all([
          getAlerts(),
          getUnreadAlertsCount()
        ]);
        setAlerts(alertsData);
        setUnreadCount(unreadData);
      } catch (error) {
        console.error('Erreur lors du chargement des alertes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
    const pollMs = isOpen ? 5000 : 15000;
    const timer = window.setInterval(loadAlerts, pollMs);

    return () => window.clearInterval(timer);
  }, [token, isOpen]);

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
        if (!payload.id) return;
        const incomingId = String(payload.id);
        setAlerts((prev) => {
          if (prev.some((a) => String(a.id) === incomingId)) {
            return prev;
          }
          const incoming: Alert = {
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
          return [incoming, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
      } catch {
        // Ignore malformed mercure payloads.
      }
    };

    source.onerror = () => {
      // EventSource auto-reconnects by default.
    };

    return () => source.close();
  }, [token, userId]);

  useEffect(() => {
    const previous = prevUnreadCountRef.current;
    const hasNewUnread = unreadCount > previous;
    const hasPendingUser = alerts.some(
      (a) => a.type === "NEW_USER_PENDING" && a.status === "unread"
    );

    if (hasNewUnread && hasPendingUser) {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = 1046;
        gain.gain.value = 0.03;
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.08);
      } catch {
        // Ignore audio API failures silently.
      }
    }

    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, alerts]);

  const handleMarkAllAsRead = async () => {
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
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAlertAsRead(alertId);
      setAlerts(alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'read' as const, read_at: new Date().toISOString() }
          : alert
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical': return 'bg-error-500';
      case 'warning': return 'bg-warning-500';
      case 'info': return 'bg-info-500';
      default: return 'bg-gray-500';
    }
  };

  const pendingActivationCount = useMemo(
    () => alerts.filter((a) => a.type === "NEW_USER_PENDING" && a.status === "unread").length,
    [alerts]
  );

  const formatAlertType = (type: Alert["type"]) => {
    if (type === "NEW_USER_PENDING") return "Nouveau compte";
    return type.replace(/_/g, " ").toLowerCase();
  };

  const getSafeAlertUrl = (alert: Alert): string | null => {
    const rawUrl = (alert.action_url || "").trim();
    if (!rawUrl) return null;

    // Legacy backend URLs used route-group names that are not public routes.
    if (rawUrl.startsWith("/admin/(others-pages)/")) {
      const legacy = rawUrl.replace("/admin/(others-pages)/", "/");
      const [legacyPath, maybeId] = legacy.split("/").filter(Boolean);

      if (!legacyPath) return "/notifications";
      if (maybeId && /^\d+$/.test(maybeId)) {
        return `/${legacyPath}?focus=${maybeId}`;
      }
      return `/${legacyPath}`;
    }

    return rawUrl;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) {
      return 'à l\'instant';
    }

    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) {
      return `il y a ${diffSecs} ${diffSecs > 1 ? "secondes" : "seconde"}`;
    }

    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) {
      return `il y a ${diffMins} ${diffMins > 1 ? "minutes" : "minute"}`;
    }

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `il y a ${diffHours} ${diffHours > 1 ? "heures" : "heure"}`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `il y a ${diffDays} ${diffDays > 1 ? "jours" : "jour"}`;
  };

  return (
    <div className="relative" data-tour="header-notifications">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
            unreadCount === 0 ? "hidden" : "flex"
          }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notification
          </h5>
          {pendingActivationCount > 0 && (
            <span className="rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
              {pendingActivationCount} activation{pendingActivationCount > 1 ? "s" : ""}
            </span>
          )}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Tout marquer lu
              </button>
            )}
            <button
              onClick={toggleDropdown}
              className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {loading ? (
            <li className="flex items-center justify-center p-4 text-gray-500">
              <span>Chargement...</span>
            </li>
          ) : alerts.length === 0 ? (
            <li className="flex items-center justify-center p-4 text-gray-500">
              <span>Aucune notification</span>
            </li>
          ) : (
            alerts.slice(0, 10).map((alert) => (
              <li key={alert.id}>
                <DropdownItem
                  onItemClick={() => {
                    if (alert.status === 'unread') {
                      handleMarkAsRead(alert.id);
                    }
                    const targetUrl = getSafeAlertUrl(alert);
                    if (targetUrl) window.location.href = targetUrl;
                    closeDropdown();
                  }}
                  className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
                    alert.status === 'unread' ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                    <div className={`w-full h-full rounded-full ${getSeverityColor(alert.severity)} opacity-20`}></div>
                    <span className={`absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white ${getSeverityColor(alert.severity)} dark:border-gray-900`}></span>
                  </span>

                  <span className="block flex-1">
                    <span className="mb-1.5 block text-sm text-gray-800 dark:text-white/90">
                      <span className="font-medium">{alert.title}</span>
                    </span>

                    <span className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                      {alert.message}
                    </span>

                    <span className="flex items-center gap-2 text-gray-500 text-xs dark:text-gray-400">
                      <span className="capitalize">{formatAlertType(alert.type)}</span>
                      {alert.type === "NEW_USER_PENDING" && (
                        <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                          Action admin
                        </span>
                      )}
                      {alert.created_at && (
                        <>
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <span>{formatDate(alert.created_at)}</span>
                        </>
                      )}
                    </span>
                  </span>

                  {alert.status === 'unread' && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </DropdownItem>
              </li>
            ))
          )}
        </ul>
        <Link
          href="/notifications"
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Voir toutes les notifications
        </Link>
      </Dropdown>
    </div>
  );
}
