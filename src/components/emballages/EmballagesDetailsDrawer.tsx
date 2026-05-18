"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Tag,
  Layers,
  Weight,
  Maximize2,
  Ruler,
  Package,
  Gauge,
  FileText,
  Calendar,
} from "lucide-react";
import type { TableEmballages } from "@/types/emballage";

interface Props {
  emballage: TableEmballages | null;
  open: boolean;
  onClose: () => void;
  canManage?: boolean;
  onRequestEdit?: (item: TableEmballages) => void;
}

function formatDateTime(date?: string | null) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function EmballagesDetailsDrawer({
  emballage,
  open,
  onClose,
  canManage = false,
  onRequestEdit,
}: Props) {
  useEffect(() => {
    if (!open || !emballage) return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPaddingRight = body.style.paddingRight;
    const scrollbarW = window.innerWidth - html.clientWidth;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollbarW > 0) {
      body.style.paddingRight = `${scrollbarW}px`;
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.paddingRight = prevBodyPaddingRight;
    };
  }, [open, emballage, onClose]);

  if (!open || !emballage) return null;

  const cap =
    emballage.capacity_value != null && Number.isFinite(emballage.capacity_value)
      ? `${emballage.capacity_value} ${emballage.capacity_unit ?? ""}`.trim()
      : "—";

  const panel = (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[969] cursor-default border-0 bg-[#1C2434]/25 backdrop-blur-sm"
        aria-label="Fermer le panneau"
        onClick={onClose}
      />
      <aside
        className="fixed right-0 top-0 z-[970] flex h-full max-h-[100dvh] min-h-0 w-full max-w-xl flex-col overflow-hidden bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.06)] animate-in slide-in-from-right duration-300"
        aria-modal="true"
        aria-labelledby="emballage-detail-title"
        role="dialog"
      >
        <div className="flex shrink-0 items-start justify-between px-8 pb-6 pt-10 sm:px-10 sm:pt-12">
          <div className="min-w-0 pr-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
                  emballage.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {emballage.status}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                #{emballage.id}
              </span>
            </div>
            <h2
              id="emballage-detail-title"
              className="text-3xl font-black leading-tight tracking-tight text-[#1C2434] sm:text-[34px]"
            >
              {emballage.name}
            </h2>
            <p className="mt-2 font-mono text-sm font-bold uppercase tracking-wide text-[#00A09D]">
              {emballage.code}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
            aria-label="Fermer"
          >
            <X size={22} className="transition-transform group-hover:rotate-90" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-8 py-4 scrollbar-hide sm:px-10">
          <div className="rounded-[1.75rem] border border-gray-100 bg-gray-50/80 p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              Identification
            </p>
            <div className="mt-4 space-y-4">
              <DetailLine icon={<Tag size={18} />} label="Type" value={emballage.type || "—"} />
              <DetailLine
                icon={<Layers size={18} />}
                label="Matière"
                value={emballage.material?.trim() || "Non renseigné"}
              />
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              Spécifications
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailLine icon={<Weight size={18} />} label="Poids" value={`${emballage.poids ?? 0} kg`} />
              <DetailLine
                icon={<Maximize2 size={18} />}
                label="Largeur"
                value={`${emballage.largeur ?? 0} cm`}
              />
              <DetailLine
                icon={<Ruler size={18} />}
                label="Épaisseur PP"
                value={`${emballage.epaisseur_pp ?? 0} μ`}
              />
              <DetailLine
                icon={<Ruler size={18} />}
                label="Épaisseur PPC"
                value={`${emballage.epaisseur_ppc ?? 0} μ`}
              />
              <DetailLine icon={<Package size={18} />} label="Capacité nominale" value={cap} />
              <DetailLine
                icon={<Gauge size={18} />}
                label="Stock minimum (alerte)"
                value={
                  emballage.min_stock != null ? String(emballage.min_stock) : "—"
                }
              />
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-indigo-100/80 bg-indigo-50/40 p-6">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700">
              <FileText size={14} aria-hidden />
              Description
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-gray-800">
              {emballage.description?.trim() || "Aucune description renseignée."}
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-gray-100 bg-white p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              Suivi
            </p>
            <div className="mt-4 space-y-4">
              <DetailLine
                icon={<Calendar size={18} />}
                label="Créé le"
                value={formatDateTime(emballage.created_at)}
              />
              <DetailLine
                icon={<Calendar size={18} />}
                label="Mis à jour le"
                value={formatDateTime(emballage.updated_at)}
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-col gap-3 border-t border-gray-50 bg-white px-8 py-6 sm:flex-row sm:px-10">
          {canManage && onRequestEdit ? (
            <button
              type="button"
              onClick={() => {
                onRequestEdit(emballage);
                onClose();
              }}
              className="h-14 flex-1 rounded-2xl border-2 border-gray-900 bg-white text-[11px] font-black uppercase tracking-widest text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
            >
              Modifier
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className={`h-14 rounded-2xl bg-[#1C2434] text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-gray-200 transition-colors hover:bg-[#00A09D] ${
              canManage && onRequestEdit ? "flex-1" : "w-full"
            }`}
          >
            Fermer
          </button>
        </div>
      </aside>
    </>
  );

  return createPortal(panel, document.body);
}

function DetailLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-[#00A09D]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</p>
        <p className="mt-1 break-words text-sm font-black text-[#1C2434]">{value}</p>
      </div>
    </div>
  );
}
