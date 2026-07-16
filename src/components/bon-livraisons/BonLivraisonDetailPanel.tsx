"use client";

import {
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
  bl: TableBonLivraison;
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
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-[#00A09D]">{icon}</div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function BonLivraisonDetailPanel({
  bl,
  emballageLabel,
  entrepotLabel,
  unitCode,
  userNamesById,
  documentDownloadLoading,
  onViewDocument,
  onDownloadDocument,
  onEdit,
}: Props) {
  const isValide = bl.statut === "VALIDE";
  const cmd = bl.commande;
  const qteCommande = Number(cmd?.quantite ?? 0);
  const qteRecueCommande = Number(cmd?.quantite_recue_total ?? 0);
  const ratio = qteCommande > 0 ? Math.min((qteRecueCommande / qteCommande) * 100, 100) : 0;

  return (
    <div className="border-t border-indigo-100/40 p-8 animate-in slide-in-from-top duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              isValide ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
            }`}
          >
            {bl.statut}
          </span>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Réception du {formatDate(bl.date_reception)}
          </span>
        </div>
        {onEdit ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-700 transition-colors"
          >
            <Edit2 size={14} />
            Modifier
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest">
            <Truck className="h-3 w-3" /> Quantité reçue
          </div>
          <div className="p-6 rounded-[2rem] bg-white border border-gray-100 shadow-sm">
            <div className="text-3xl font-black text-gray-900 tracking-tight">
              {formatQuantitePrincipale(Number(bl.quantite_recue || 0))}
              {unitCode ? (
                <span className="ml-2 text-sm text-[#00A09D] font-black uppercase tracking-widest">
                  {unitCode}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400 tracking-widest">
            <span>Progression commande</span>
            {cmd && qteCommande > 0 ? (
              <span className="text-indigo-600">{Math.round(ratio)}%</span>
            ) : null}
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
            {cmd && qteCommande > 0 ? (
              <>
                <p className="text-xs font-black text-gray-700">{cmd.numero_commande}</p>
                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
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
              </>
            ) : (
              <p className="text-sm font-bold text-gray-400">—</p>
            )}
            <div className="pt-2 border-t border-gray-50 space-y-3">
              <InfoRow
                icon={<ShoppingCart size={16} />}
                label="Commande"
                value={bl.numero_commande || "—"}
              />
              {cmd?.fournisseur?.raison_sociale ? (
                <InfoRow
                  icon={<User size={16} />}
                  label="Fournisseur"
                  value={cmd.fournisseur.raison_sociale}
                />
              ) : null}
              <InfoRow
                icon={<Package size={16} />}
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
                icon={<Warehouse size={16} />}
                label="Entrepôt destination"
                value={entrepotLabel || (bl.entrepot_id ? `#${bl.entrepot_id}` : "—")}
              />
              {cmd?.contrat?.numero_contrat ? (
                <InfoRow
                  icon={<FileText size={16} />}
                  label="Contrat"
                  value={cmd.contrat.numero_contrat}
                />
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
            Traçabilité & justificatif
          </div>
          <div className="bg-white/50 p-5 rounded-2xl border border-dashed border-gray-200 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Réceptionné par</span>
                <span className="text-xs font-black text-gray-900">
                  {userLabel(bl.receptionne_par, userNamesById)}
                </span>
              </div>
              <div className="h-px bg-gray-100 w-full" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Modifié par</span>
                <span className="text-xs font-black text-gray-900">
                  {userLabel(bl.modified_by, userNamesById)}
                </span>
              </div>
              <div className="h-px bg-gray-100 w-full" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Date validation</span>
                <span className="text-xs font-black text-gray-900">
                  {formatDateTime(bl.date_validation)}
                </span>
              </div>
              <div className="h-px bg-gray-100 w-full" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                  <Calendar size={12} /> Créé le
                </span>
                <span className="text-xs font-black text-gray-900">{formatDateTime(bl.created_at)}</span>
              </div>
              <div className="h-px bg-gray-100 w-full" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Modifié le</span>
                <span className="text-xs font-black text-gray-900">{formatDateTime(bl.updated_at)}</span>
              </div>
            </div>

            {bl.document_bl ? (
              <div className="flex gap-2 pt-2">
                {onViewDocument ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDocument();
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    <Eye size={14} />
                    Visualiser
                  </button>
                ) : null}
                {onDownloadDocument ? (
                  <button
                    type="button"
                    disabled={documentDownloadLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadDocument();
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-40"
                  >
                    <Download size={14} />
                    Télécharger
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
