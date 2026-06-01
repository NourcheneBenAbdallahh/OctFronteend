"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import { useLiveAlertsContext } from "@/context/LiveAlertsContext";
import type { Alert } from "@/lib/notifications.api";
import {
  formatRelativeTime,
  getAlertCtaLabel,
  getAlertCtaTone,
  getAlertIconTone,
  getSafeAlertUrl,
} from "@/lib/notifications.helpers";

type ToastItem = {
  key: string;
  alert: Alert;
};

const AUTO_DISMISS_MS = 10000;
const MAX_VISIBLE = 3;

export default function AlertToastStack() {
  const router = useRouter();
  const { subscribeNewAlert, markAsRead } = useLiveAlertsContext();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const dismissToast = useCallback((key: string) => {
    setToasts((prev) => prev.filter((toast) => toast.key !== key));
  }, []);

  useEffect(() => {
    const pushToast = (alert: Alert) => {
      const key = `${alert.id}-${Date.now()}`;
      setToasts((prev) => [...prev, { key, alert }].slice(-MAX_VISIBLE));
      window.setTimeout(() => dismissToast(key), AUTO_DISMISS_MS);
    };

    return subscribeNewAlert(pushToast);
  }, [subscribeNewAlert, dismissToast]);

  const openToast = async (toast: ToastItem) => {
    if (toast.alert.status === "unread") {
      await markAsRead(toast.alert.id);
    }
    dismissToast(toast.key);
    const targetUrl = getSafeAlertUrl(toast.alert);
    if (targetUrl) {
      router.push(targetUrl);
    }
  };

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[9999] flex flex-col items-start gap-3 px-4 sm:bottom-6 sm:pl-6"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => {
        const targetUrl = getSafeAlertUrl(toast.alert);
        const iconTone = getAlertIconTone(toast.alert.severity);
        const ctaTone = getAlertCtaTone(toast.alert.severity);

        return (
          <div
            key={toast.key}
            className="pointer-events-auto flex w-full max-w-[420px] items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)] animate-in slide-in-from-left-4 fade-in duration-300"
            role="status"
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconTone}`}
            >
              <Bell size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-gray-900">{toast.alert.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">{toast.alert.message}</p>
              <p className="mt-1 text-[11px] font-medium text-gray-400">
                {formatRelativeTime(toast.alert.created_at)}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              {targetUrl ? (
                <button
                  type="button"
                  onClick={() => void openToast(toast)}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white transition-colors ${ctaTone}`}
                >
                  {getAlertCtaLabel(toast.alert)}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => dismissToast(toast.key)}
                className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Fermer la notification"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
