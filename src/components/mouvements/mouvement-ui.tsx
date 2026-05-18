import { MOUVEMENT_TYPES } from "@/lib/mouvement.config";
import { MouvementStatut, MouvementType } from "@/types/mouvement";
import { ReactNode } from "react";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utilitaire pour fusionner les classes proprement (évite les conflits Tailwind)
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function TypeBadge({ type }: { type: MouvementType }) {
  const meta = MOUVEMENT_TYPES[type];

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border",
      meta.badgeClass // Utilise les classes de ton config (ex: bg-blue-50 text-blue-700 border-blue-100)
    )}>
      <span className="text-xs">{meta.icon}</span>
      {meta.label}
    </span>
  );
}

export function StatusBadge({ statut }: { statut: MouvementStatut }) {
  const isValide = statut === "VALIDE";
  
  return (
    <span className={cn(
      "inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-[1000] uppercase tracking-widest border",
      isValide 
        ? "bg-[#00A09D]/10 text-[#00A09D] border-[#00A09D]/20" 
        : "bg-amber-50 text-amber-600 border-amber-100"
    )}>
      <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", isValide ? "bg-[#00A09D]" : "bg-amber-500")} />
      {statut}
    </span>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
  className
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm", className)}>
      <div className="mb-5">
        <h4 className="text-xs font-[1000] uppercase tracking-[0.15em] text-[#1C2434]">{title}</h4>
        {subtitle && <p className="mt-1 text-[11px] font-medium text-gray-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// CORRECTIF ICI : Ajout de className et de la prop optionnelle
export function Label({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string 
}) {
  return (
    <label className={cn(
      "mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-[#1C2434]/60", 
      className
    )}>
      {children}
    </label>
  );
}

// Classes d'input avec le focus sur ton Teal (#00A09D)
export const inputClass =
  "w-full rounded-2xl border-2 border-gray-50 bg-gray-50/30 px-5 py-3.5 text-sm font-bold text-[#1C2434] outline-none transition-all placeholder:text-gray-300 focus:border-[#00A09D]/30 focus:bg-white focus:ring-4 focus:ring-[#00A09D]/5";

export const selectClass = cn(inputClass, "cursor-pointer appearance-none bg-no-repeat bg-right-4");