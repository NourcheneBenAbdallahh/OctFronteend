import React from "react";
import { Search, Plus, Users } from "lucide-react";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { BREADCRUMBS } from "@/lib/breadcrumbs";
import { RoleSearchableDropdown } from "./RoleSearchableDropdown";
import type { AssignableUserRole } from "@/lib/users.api";

interface Props {
  searchInput: string;
  setSearchInput: (q: string) => void;
  roleFilter: string;
  setRoleFilter: React.Dispatch<React.SetStateAction<string>>;
  roleOptions: AssignableUserRole[];
  roleFr: (role: string) => string;
  onOpenNew: () => void;
  total: number;
  perPage: number;
  setPerPage: (n: number) => void;
}

export const UsersHeader = ({
  searchInput,
  setSearchInput,
  roleFilter,
  setRoleFilter,
  roleOptions,
  roleFr,
  onOpenNew,
  total,
  perPage,
  setPerPage,
}: Props) => (
  <div className="mb-8 space-y-8">
    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
        <BreadcrumbNav items={BREADCRUMBS.users} className="mb-2" />
        <h1 className="text-4xl font-black tracking-tighter text-gray-900 sm:text-5xl">
          Utilisateurs
          <span className="text-[#00A09D]">.</span>
        </h1>
      </div>
      <div className="flex min-w-[160px] items-center gap-4 rounded-[2rem] border border-gray-50 bg-white p-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Users size={18} />
        </div>
        <div>
          <span className="mb-1 block text-[9px] font-black uppercase leading-none tracking-widest text-gray-400">
            Équipe
          </span>
          <span className="text-xl font-black leading-none text-gray-900">
            {total} {total <= 1 ? "utilisateur" : "utilisateurs"}
          </span>
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="flex flex-1 items-center rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-500/10">
        <Search size={18} className="mr-3 shrink-0 text-gray-300" />
        <input
          type="search"
          className="min-w-0 flex-1 text-sm font-medium outline-none placeholder:text-gray-300"
          placeholder="Rechercher nom ou email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>
      <div className="w-full min-w-0 sm:max-w-[220px]">
        <RoleSearchableDropdown
          value={roleFilter}
          onChange={setRoleFilter}
          options={roleOptions}
          roleFr={roleFr}
          placeholder="Tous les rôles"
          includeAllOption={{ label: "Tous les rôles" }}
        />
      </div>
      <button
        type="button"
        onClick={onOpenNew}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border-2 border-gray-900 bg-white px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-[8px_8px_0px_rgba(0,160,157,0.2)] transition-all hover:bg-gray-900 hover:text-white"
      >
        <Plus size={14} />
        Ajouter
      </button>
      <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 lg:ml-auto">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Lignes</span>
        <select
          value={perPage}
          onChange={(e) => setPerPage(Number(e.target.value))}
          className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-gray-700 outline-none"
        >
          {[10, 15, 30, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </div>
    </div>
  </div>
);
