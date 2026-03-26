import { MOUVEMENT_TYPES } from "@/lib/mouvement.config";
import { MouvementStatut, MouvementType } from "@/types/mouvement";

export function TypeBadge({ type }: { type: MouvementType }) {
  const meta = MOUVEMENT_TYPES[type];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${meta.badgeClass}`}>
      <span>{meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  );
}

export function StatusBadge({ statut }: { statut: MouvementStatut }) {
  const cls =
    statut === "VALIDE"
      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
      : "bg-amber-100 text-amber-700 border border-amber-200";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${cls}`}>
      {statut}
    </span>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        {subtitle ? <div className="mt-1 text-xs text-gray-500">{subtitle}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

export const selectClass = inputClass;