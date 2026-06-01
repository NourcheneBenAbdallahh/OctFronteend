"use client";

import { ExternalLink, Mail } from "lucide-react";
import { buildGmailComposeUrl } from "@/lib/gmail";
import { isValidEmailFormat } from "@/lib/email-validation";

type Props = {
  email?: string | null;
  subject?: string;
  body?: string;
  className?: string;
  emptyLabel?: string;
};

export function GmailEmailLink({
  email,
  subject,
  body,
  className = "",
  emptyLabel = "—",
}: Props) {
  const trimmed = email?.trim() ?? "";
  if (!trimmed) {
    return <span className={`text-gray-400 ${className}`}>{emptyLabel}</span>;
  }

  if (!isValidEmailFormat(trimmed)) {
    return <span className={`font-mono text-gray-500 ${className}`}>{trimmed}</span>;
  }

  const href = buildGmailComposeUrl(trimmed, { subject, body });

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Écrire via Gmail"
      className={`inline-flex items-center gap-1.5 font-mono text-[#00A09D] hover:text-indigo-600 hover:underline underline-offset-2 transition-colors ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <Mail size={12} className="shrink-0 opacity-70" aria-hidden />
      <span>{trimmed}</span>
      <ExternalLink size={10} className="shrink-0 opacity-50" aria-hidden />
    </a>
  );
}
