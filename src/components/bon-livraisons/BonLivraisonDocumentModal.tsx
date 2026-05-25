"use client";

import React, { useEffect, useState } from "react";
import { Download, Eye, FileText, Loader2, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import {
  downloadBlob,
  fetchBonLivraisonDocument,
} from "@/lib/bon-livraisons.document";
import { useAuthStore } from "@/store/useAuthStore";

type Props = {
  open: boolean;
  onClose: () => void;
  bonLivraisonId: string | number | null;
  numeroBl?: string | null;
};

export function BonLivraisonDocumentModal({
  open,
  onClose,
  bonLivraisonId,
  numeroBl,
}: Props) {
  const token = useAuthStore((s) => s.token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [kind, setKind] = useState<"pdf" | "image" | "other">("pdf");
  const [blob, setBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (!open) {
      setLoading(false);
      setError("");
      setFilename("");
      setKind("pdf");
      setBlob(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    if (!bonLivraisonId) return;

    let cancelled = false;
    let objectUrl: string | null = null;
    setLoading(true);
    setError("");

    fetchBonLivraisonDocument(bonLivraisonId, "inline", token ?? undefined)
      .then((result) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(result.blob);
        setPreviewUrl(objectUrl);
        setFilename(result.filename);
        setKind(result.kind);
        setBlob(result.blob);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Erreur de chargement.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, bonLivraisonId, token]);

  const handleDownload = () => {
    if (blob && filename) {
      downloadBlob(blob, filename);
      return;
    }
    if (!bonLivraisonId) return;
    setLoading(true);
    fetchBonLivraisonDocument(bonLivraisonId, "attachment", token ?? undefined)
      .then((result) => downloadBlob(result.blob, result.filename))
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Téléchargement impossible.");
      })
      .finally(() => setLoading(false));
  };

  if (!open) return null;

  const title = numeroBl ? `Justificatif — ${numeroBl}` : "Justificatif BL";

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] p-0"
      showCloseButton={false}
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tight text-gray-900">{title}</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Document justificatif de réception
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={loading || !!error}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-600 transition hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Télécharger
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="min-h-[50vh] flex-1 overflow-auto bg-gray-50 p-4">
        {loading ? (
          <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-[10px] font-black uppercase tracking-widest">Chargement du document…</p>
          </div>
        ) : error ? (
          <div className="flex h-[50vh] flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-sm font-bold text-red-600">{error}</p>
          </div>
        ) : previewUrl && kind === "pdf" ? (
          <iframe
            title={title}
            src={previewUrl}
            className="h-[min(70vh,720px)] w-full rounded-2xl border border-gray-200 bg-white shadow-sm"
          />
        ) : previewUrl && kind === "image" ? (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={filename || title}
              className="max-h-[min(70vh,720px)] max-w-full rounded-2xl border border-gray-200 bg-white object-contain shadow-sm"
            />
          </div>
        ) : previewUrl ? (
          <div className="flex h-[40vh] flex-col items-center justify-center gap-4 text-center">
            <Eye className="h-10 w-10 text-indigo-400" />
            <p className="text-sm font-medium text-gray-500">
              Aperçu non disponible pour ce type de fichier.
            </p>
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-700"
            >
              Télécharger le fichier
            </button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
