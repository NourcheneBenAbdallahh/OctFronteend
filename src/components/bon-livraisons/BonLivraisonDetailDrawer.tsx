"use client";

import {
  X,
  FileText,
  ShoppingCart,
  Warehouse,
  Package,
  Calendar,
  User,
  Eye,
  Download,
  Edit2,
  Truck,
} from "lucide-react";
import type { TableBonLivraison } from "@/types/bon-livraison";
import { formatQuantitePrincipale } from "@/lib/unite-conversion";

interface Props {
  bl: TableBonLivraison | null;
  open: boolean;
  onClose: () => void;
  emballageLabel?: string;
  entrepotLabel?: string;
  unitCode?: string;
  userNamesById: Record<string, string>;
  documentDownloadLoading?: boolean;
  onViewDocument?: () => void;
  onDownloadDocument?: () => void;
  onEdit?: () => void;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const raw = value.includes("T") ? value.split("T")[0] : value;
  return new Date(raw).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function userLabel(id: string | number | null | undefined, map: Record<string, string>) {
  if (id == null || id === "") return "—";
  return map[String(id)] ?? `#${id}`;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="mt-0.5 text-[#00A09D] group-hover:scale-110 transition-transform">{icon}</div>
      <div>
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{label}</p>
        <p className="text-[15px] font-bold text-gray-700 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function BonLivraisonDetailDrawer({
  bl,
  open,
  onClose,
  emballageLabel,
  entrepotLabel,
  unitCode,
  userNamesById,
  documentDownloadLoading,
  onViewDocument,
  onDownloadDocument,
  onEdit,
}: Props) {
  if (!open || !bl) return null;

  const isValide = bl.statut === "VALIDE";
  const cmd = bl.commande;
  const qteCommande = Number(cmd?.quantite ?? 0);
  const qteRecueCommande = Number(cmd?.quantite_recue_total ?? 0);
  const ratio = qteCommande > 0 ? Math.min((qteRecueCommande / qteCommande) * 100, 100) : 0;

  return (
    <div className="fixed inset-0 z-[999] overflow-hidden">
      <div
        className="absolute inset-0 bg-[#1C2434]/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <aside
        className="absolute right-0 top-0 flex h-full max-h-[100dvh] min-h-0 w-full max-w-xl flex-col overflow-hidden bg-white shadow-[-20px_0_80px_rgba(0,0,0,0.1)] animate-in slide-in-from-right duration-500"
        aria-modal="true"
        role="dialog"
        aria-labelledby="bl-detail-title"
      >
        <div
          className={`shrink-0 px-8 py-8 border-b ${
            isValide ? "bg-emerald-50/30" : "bg-red-50/30"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-[1000] uppercase tracking-widest ${
                    isValide ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {bl.statut}
                </span>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                  Bon de livraison
                </span>
              </div>
              <h2
                id="bl-detail-title"
                className="text-3xl font-[1000] text-[#1C2434] tracking-tight"
              >
                {bl.numero_bl || "En attente"}
              </h2>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Calendar size={14} className="text-[#00A09D]" />
                Réception du {formatDate(bl.date_reception)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-all group"
            >
              <X size={20} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        </div>

        <div className="form-scroll min-h-0 flex-1 space-y-8 overflow-y-auto overscroll-contain px-8 py-8">
          <div className="p-6 rounded-[28px] bg-[#F2F7F7] border border-[#DDF2F1]">
            <div className="flex items-center gap-2 text-[#00A09D] mb-3">
              <Truck size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Quantité reçue
              </span>
            </div>
            <div className="text-4xl font-[1000] text-[#1C2434] tracking-tighter">
              {formatQuantitePrincipale(Number(bl.quantite_recue || 0))}
              {unitCode ? (
                <span className="ml-2 text-sm text-[#00A09D] font-black uppercase tracking-widest">
                  {unitCode}
                </span>
              ) : null}
            </div>
          </div>

          {cmd && qteCommande > 0 ? (
            <div className="space-y-3 p-6 rounded-[28px] bg-gray-50 border border-gray-100">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <span>Progression commande {cmd.numero_commande}</span>
                <span className="text-indigo-600">{Math.round(ratio)}%</span>
              </div>
              <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-700"
                  style={{ width: `${ratio}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
                <span>
                  Reçu : <span className="text-indigo-600">{qteRecueCommande}</span>
                </span>
                <span>
                  Commandé : <span className="text-gray-700">{qteCommande}</span>
                </span>
              </div>
            </div>
          ) : null}

          <section className="space-y-5">
            <h3 className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-gray-300 border-b pb-4">
              <FileText size={16} />
              Informations logistiques
            </h3>
            <div className="grid grid-cols-1 gap-5">
              <InfoRow
                icon={<ShoppingCart size={18} />}
                label="Commande"
                value={bl.numero_commande || "—"}
              />
              {cmd?.fournisseur?.raison_sociale ? (
                <InfoRow
                  icon={<User size={18} />}
                  label="Fournisseur"
                  value={cmd.fournisseur.raison_sociale}
                />
              ) : null}
              {cmd?.contrat?.numero_contrat ? (
                <InfoRow
                  icon={<FileText size={18} />}
                  label="Contrat"
                  value={cmd.contrat.numero_contrat}
                />
              ) : null}
              <InfoRow
                icon={<Package size={18} />}
                label="Emballage"
                value={
                  emballageLabel ||
                  (cmd?.emballage
                    ? `${cmd.emballage.code ?? ""} — ${cmd.emballage.name ?? ""}`.trim() || "—"
                    : bl.emballage_id
                      ? `#${bl.emballage_id}`
                      : "—")
                }
              />
              <InfoRow
                icon={<Warehouse size={18} />}
                label="Entrepôt destination"
                value={entrepotLabel || (bl.entrepot_id ? `#${bl.entrepot_id}` : "—")}
              />
            </div>
          </section>

          <section className="space-y-5">
            <h3 className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-gray-300 border-b pb-4">
              <User size={16} />
              Traçabilité
            </h3>
            <div className="grid grid-cols-1 gap-5">
              <InfoRow
                icon={<User size={18} />}
                label="Réceptionné par"
                value={userLabel(bl.receptionne_par, userNamesById)}
              />
              <InfoRow
                icon={<User size={18} />}
                label="Créé par"
                value={userLabel(bl.created_by, userNamesById)}
              />
              <InfoRow
                icon={<User size={18} />}
                label="Modifié par"
                value={userLabel(bl.modified_by, userNamesById)}
              />
              <InfoRow
                icon={<Calendar size={18} />}
                label="Date validation"
                value={formatDateTime(bl.date_validation)}
              />
              <InfoRow
                icon={<Calendar size={18} />}
                label="Créé le"
                value={formatDateTime(bl.created_at)}
              />
              <InfoRow
                icon={<Calendar size={18} />}
                label="Modifié le"
                value={formatDateTime(bl.updated_at)}
              />
            </div>
          </section>

          {bl.document_bl ? (
            <section className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-300">
                Justificatif
              </h3>
              <div className="flex gap-3">
                {onViewDocument ? (
                  <button
                    type="button"
                    onClick={onViewDocument}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    <Eye size={16} />
                    Visualiser
                  </button>
                ) : null}
                {onDownloadDocument ? (
                  <button
                    type="button"
                    disabled={documentDownloadLoading}
                    onClick={onDownloadDocument}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-40"
                  >
                    <Download size={16} />
                    Télécharger
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>

        <div className="shrink-0 px-8 py-6 border-t border-gray-50 bg-white flex gap-3">
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="flex-1 h-14 rounded-[20px] bg-indigo-600 text-white font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all inline-flex items-center justify-center gap-2"
            >
              <Edit2 size={16} />
              Modifier
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className={`h-14 rounded-[20px] bg-gray-50 text-[#1C2434] font-black text-[11px] uppercase tracking-widest hover:bg-gray-100 transition-all ${
              onEdit ? "flex-1" : "w-full"
            }`}
          >
            Fermer
          </button>
        </div>
      </aside>
    </div>
  );
}
