"use client";

import { useCallback, useState } from "react";
import { GraphqlRequestError, friendlyGraphqlMessage } from "@/lib/graphqlClient";

export type AppFeedbackType = "success" | "error" | "info";

export type AppFeedback = {
  type: AppFeedbackType;
  message: string;
} | null;

export type AppConfirmState = {
  title: string;
  description?: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary" | "warning";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
} | null;

export function getActionErrorMessage(err: unknown, fallback = "Une erreur est survenue.") {
  if (err instanceof GraphqlRequestError) return err.message;
  if (err instanceof Error && err.message) return friendlyGraphqlMessage(err.message);
  return fallback;
}

export function useAppFeedback() {
  const [feedback, setFeedback] = useState<AppFeedback>(null);
  const [confirm, setConfirm] = useState<AppConfirmState>(null);

  const showFeedback = useCallback((type: AppFeedbackType, message: string) => {
    setFeedback({ type, message });
  }, []);

  const showSuccess = useCallback(
    (message: string) => showFeedback("success", message),
    [showFeedback]
  );

  const showError = useCallback(
    (message: string) => showFeedback("error", message),
    [showFeedback]
  );

  const showInfo = useCallback(
    (message: string) => showFeedback("info", message),
    [showFeedback]
  );

  const clearFeedback = useCallback(() => setFeedback(null), []);

  const openConfirm = useCallback((state: Omit<NonNullable<AppConfirmState>, "loading">) => {
    setConfirm({ ...state, loading: false });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirm((c) => (c?.loading ? c : null));
  }, []);

  const setConfirmLoading = useCallback((loading: boolean) => {
    setConfirm((c) => (c ? { ...c, loading } : c));
  }, []);

  const runConfirmedAction = useCallback(
    async (action: () => void | Promise<void>, options?: { closeOnSuccess?: boolean }) => {
      setConfirmLoading(true);
      clearFeedback();
      try {
        await action();
        if (options?.closeOnSuccess !== false) setConfirm(null);
      } catch (err) {
        showError(getActionErrorMessage(err));
      } finally {
        setConfirmLoading(false);
      }
    },
    [clearFeedback, setConfirmLoading, showError]
  );

  return {
    feedback,
    confirm,
    showFeedback,
    showSuccess,
    showError,
    showInfo,
    clearFeedback,
    openConfirm,
    closeConfirm,
    setConfirmLoading,
    runConfirmedAction,
  };
}
