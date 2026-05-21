"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import type { AppFeedback } from "@/hooks/useAppFeedback";

export function AppFeedbackBanner({
  feedback,
  onDismiss,
}: {
  feedback: AppFeedback;
  onDismiss: () => void;
}) {
  if (!feedback) return null;

  const styles =
    feedback.type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : feedback.type === "error"
        ? "border-red-200 bg-red-50 text-red-900"
        : "border-blue-200 bg-blue-50 text-blue-900";

  const Icon =
    feedback.type === "success" ? CheckCircle2 : feedback.type === "error" ? AlertCircle : Info;

  const iconColor =
    feedback.type === "success"
      ? "text-emerald-600"
      : feedback.type === "error"
        ? "text-red-600"
        : "text-blue-600";

  return (
    <div role="alert" className={`flex items-start gap-4 rounded-[24px] border px-6 py-4 ${styles}`}>
      <Icon className={`h-6 w-6 shrink-0 ${iconColor}`} />
      <p className="flex-1 text-sm font-bold leading-relaxed">{feedback.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-xl p-2 opacity-60 transition-opacity hover:opacity-100"
        aria-label="Fermer le message"
      >
        <X size={18} />
      </button>
    </div>
  );
}
