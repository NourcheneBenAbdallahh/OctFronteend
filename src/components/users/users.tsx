"use client";

import React, { useMemo, useState } from "react";
import { ChevronRight, Plus, Search, UserCog, BoxSelect, Filter, UserPlus, UserPen, KeyRound, Trash2, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { TablePagination } from "@/components/ui/TablePagination";
import { useAuthStore } from "@/store/useAuthStore";
import { useUsersAdmin } from "./useUsersAdmin";
import { UserRow } from "./UserRow";
import { RoleSearchableDropdown } from "./RoleSearchableDropdown";
import { 
  UserRole, adminDeleteUser, adminUpdateUserRole, 
  adminSetUserActive, adminCreateUser, adminUpdateUser, adminResetUserPassword
} from "@/lib/users.api";
import { AppFeedbackBanner } from "@/components/ui/feedback";
import { ResponsiveTableWrap } from "@/components/ui/ResponsiveTableWrap";

const ROLE_OPTIONS: UserRole[] = ["ADMIN", "STOCK", "LOGISTIQUE", "FINANCE"];
const ROLE_LABEL: Record<string, string> = { 
  ADMIN: "Administrateur", STOCK: "Stock", LOGISTIQUE: "Logistique", FINANCE: "Finance" 
};
const roleFr = (role: string) => ROLE_LABEL[role.toUpperCase()] ?? role;

export default function UsersAdminPage() {
  const [perPage, setPerPage] = useState(15);
  const me = useAuthStore((s) => s.user);
  const {
    users, paginatorInfo, page, setPage, searchInput, setSearchInput,
    roleFilter, setRoleFilter, loading, savingId, error, success, handleAction,
    setError, setSuccess,
  } = useUsersAdmin(perPage);

  const pageFeedback =
    error != null
      ? { type: "error" as const, message: error }
      : success != null
        ? { type: "success" as const, message: success }
        : null;

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    telephone: "",
    role: "STOCK" as UserRole,
    password: "",
    is_active: true,
  });

  const resetCreateForm = () => {
    setCreateForm({
      name: "",
      email: "",
      telephone: "",
      role: "STOCK",
      password: "",
      is_active: true,
    });
  };

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    telephone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      return;
    }

    const successCreate = await handleAction(
      "create-user",
      () =>
        adminCreateUser({
          name: createForm.name.trim(),
          email: createForm.email.trim(),
          telephone: createForm.telephone.trim() || null,
          role: createForm.role,
          password: createForm.password,
          is_active: createForm.is_active,
        }),
      "Utilisateur créé avec succès."
    );

    if (successCreate) {
      setCreateModalOpen(false);
      resetCreateForm();
    }
  };

  const openEditModal = (user: any) => {
    setSelectedUserId(String(user.id));
    setSelectedUserName(user.name ?? "");
    setEditForm({
      name: user.name ?? "",
      email: user.email ?? "",
      telephone: user.telephone ?? "",
    });
    setEditModalOpen(true);
  };

  const openPasswordModal = (user: any) => {
    setSelectedUserId(String(user.id));
    setSelectedUserName(user.name ?? "");
    setPasswordForm({ password: "", confirmPassword: "" });
    setPasswordModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    if (!editForm.name.trim() || !editForm.email.trim()) return;

    const ok = await handleAction(
      `edit-${selectedUserId}`,
      () =>
        adminUpdateUser(selectedUserId, {
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          telephone: editForm.telephone.trim() || null,
        }),
      "Utilisateur modifié avec succès."
    );

    if (ok) {
      setEditModalOpen(false);
      setSelectedUserId(null);
      setSelectedUserName("");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    if (passwordForm.password.length < 8) {
      return;
    }
    if (passwordForm.password !== passwordForm.confirmPassword) {
      return;
    }

    const ok = await handleAction(
      "reset-password",
      () => adminResetUserPassword(selectedUserId, passwordForm.password),
      "Mot de passe réinitialisé avec succès."
    );

    if (ok) {
      setPasswordModalOpen(false);
      setSelectedUserId(null);
      setSelectedUserName("");
      setPasswordForm({ password: "", confirmPassword: "" });
    }
  };

  const onDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDeleteUser = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    const ok = await handleAction(
      `delete-${id}`,
      () => adminDeleteUser(id),
      "Utilisateur supprimé."
    );
    if (ok) {
      setDeleteTarget(null);
    }
  };

  const totalPages = paginatorInfo?.lastPage ?? 1;

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-gray-900 dark:text-white">
            Utilisateurs<span className="text-[#00A09D]">.</span>
          </h1>
          <nav className="mt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <span>Administration</span> <ChevronRight size={10} /> <span>Gestion des accès</span>
          </nav>
        </div>
        <div className="flex min-w-[180px] items-center gap-4 rounded-[2rem] border border-gray-50 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40">
            <UserCog size={18} />
          </div>
          <div>
            <span className="mb-1 block text-[9px] font-black uppercase text-gray-400">Total</span>
            <span className="text-xl font-black text-gray-900 dark:text-white">
              {paginatorInfo?.total ?? 0} comptes
            </span>
          </div>
        </div>
      </section>

      {/* SEARCH & FILTERS */}
      <section className="flex flex-col gap-3">
        <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <Search size={18} className="mr-3 shrink-0 text-gray-300" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher nom ou email..."
            className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
          />
          <Filter size={18} className="ml-3 shrink-0 text-gray-400" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="min-w-0 flex-1 sm:max-w-[220px]">
            <RoleSearchableDropdown
              value={roleFilter}
              onChange={(r) => setRoleFilter(r as UserRole | "")}
              options={ROLE_OPTIONS}
              roleFr={roleFr}
              placeholder="Tous les rôles"
              includeAllOption={{ label: "Tous les rôles" }}
            />
          </div>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl border-2 border-gray-900 bg-white px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-[6px_6px_0px_rgba(0,160,157,0.2)] transition-all hover:bg-gray-900 hover:text-white sm:w-auto sm:px-8 sm:py-4"
          >
            <Plus size={14} /> Nouveau
          </button>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 sm:ml-auto">
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
      </section>

      <AppFeedbackBanner
        feedback={pageFeedback}
        onDismiss={() => {
          setError(null);
          setSuccess(null);
        }}
      />

      <div className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-sm">
      <ResponsiveTableWrap showScrollHint={users.length > 0}>
      {users.length > 0 ? (
    <table className="w-full min-w-[920px] text-left border-collapse">
              <thead>
              <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                  <th className="px-8 py-6">Photo</th>
                  <th className="px-8 py-6">Utilisateur</th>
                  <th className="px-8 py-6">Contact</th>
                  <th className="px-8 py-6">Rôle</th>
                  <th className="px-8 py-6 text-center">Statut</th>
                  <th className="px-8 py-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <UserRow 
                    key={u.id}
                    user={u}
                    isMe={String(u.id) === String(me?.id)}
                    savingId={savingId}
                    roleOptions={ROLE_OPTIONS}
                    roleFr={roleFr}
                    onUpdateRole={(id, role) => handleAction(`role-${id}`, () => adminUpdateUserRole(id, role), "Rôle mis à jour.")}
                    onToggleActive={(user) => handleAction(`active-${user.id}`, () => adminSetUserActive(String(user.id), !user.isActive), "Statut mis à jour.")}
                    onDelete={onDelete}
                    onEdit={openEditModal}
                    onPwd={openPasswordModal}
                  />
                ))}
              </tbody>
            </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-24">
            <BoxSelect size={48} className="text-gray-200 mb-4" />
            <h3 className="font-black text-gray-900 dark:text-white">Aucun résultat</h3>
          </div>
        )}
      </ResponsiveTableWrap>

        {paginatorInfo && paginatorInfo.lastPage > 1 && (
          <div className="mt-4 flex flex-col items-center gap-3 border-t border-gray-50 px-4 py-6">
            <TablePagination
              currentPage={page}
              totalPages={paginatorInfo.lastPage}
              onPageChange={setPage}
            />
          </div>
        )}
        {paginatorInfo && (
          <div className="pb-5 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
            {paginatorInfo.total} utilisateurs au total
          </div>
        )}
      </div>

      {/* Le Modal de création (peut être déplacé dans UserModals.tsx) */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          resetCreateForm();
        }}
        position="right"
        className="w-full max-w-xl overflow-hidden rounded-l-[2rem] bg-white shadow-[-30px_0_60px_rgba(0,0,0,0.1)] sm:rounded-l-[3rem]"
      >
        <div className="flex max-h-[100dvh] flex-col">
          <div className="p-6 pb-4 sm:p-10 sm:pb-6">
            <div className="mb-8 flex items-start justify-between">
              <div>
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 underline decoration-2 underline-offset-4">
                  Gestion Utilisateurs
                </span>
                <h2 className="text-3xl font-black leading-none tracking-tighter text-gray-900">
                  Nouvel Utilisateur
                </h2>
              </div>
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  resetCreateForm();
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#1C2434]" />
          </div>

          <form onSubmit={handleCreateSubmit} className="flex h-full flex-col">
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4 sm:space-y-8 sm:px-10">
              <div className="rounded-[2rem] border border-indigo-100/60 bg-indigo-50/50 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600">
                    <UserPlus size={18} />
                  </div>
                  <p className="text-xs font-bold text-indigo-700">
                    Crée un compte avec rôle et accès immédiats.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Nom</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black outline-none transition-all focus:border-indigo-500/20 focus:bg-white"
                    placeholder="Nom complet"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Email</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black outline-none transition-all focus:border-indigo-500/20 focus:bg-white"
                    placeholder="utilisateur@domaine.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Téléphone</label>
                  <input
                    type="text"
                    value={createForm.telephone}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, telephone: e.target.value }))}
                    className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black outline-none transition-all focus:border-indigo-500/20 focus:bg-white"
                    placeholder="+216 ..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Rôle</label>
                  <RoleSearchableDropdown
                    value={createForm.role}
                    onChange={(r) => setCreateForm((prev) => ({ ...prev, role: r as UserRole }))}
                    options={ROLE_OPTIONS}
                    roleFr={roleFr}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Mot de passe</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black outline-none transition-all focus:border-indigo-500/20 focus:bg-white"
                  placeholder="Minimum recommandé: 8 caractères"
                  required
                />
              </div>

              <label className="inline-flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={createForm.is_active}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Compte actif à la création
              </label>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-50 bg-white p-6 sm:flex-row sm:items-center sm:gap-4 sm:p-10">
              <button
                type="button"
                onClick={() => {
                  setCreateModalOpen(false);
                  resetCreateForm();
                }}
                className="h-14 rounded-2xl border-2 border-gray-100 px-6 text-[11px] font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-gray-50 sm:h-16 sm:px-8"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={savingId === "create-user"}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1C2434] text-[12px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-indigo-600 disabled:opacity-50 sm:h-16"
              >
                {savingId === "create-user" ? "Création..." : "Créer l'utilisateur"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedUserId(null);
          setSelectedUserName("");
        }}
        position="right"
        className="w-full max-w-xl overflow-hidden rounded-l-[2rem] bg-white shadow-[-30px_0_60px_rgba(0,0,0,0.1)] sm:rounded-l-[3rem]"
      >
        <div className="flex max-h-[100dvh] flex-col">
          <div className="p-6 pb-4 sm:p-10 sm:pb-6">
            <div className="mb-8 flex items-start justify-between">
              <div>
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 underline decoration-2 underline-offset-4">
                  Gestion Utilisateurs
                </span>
                <h2 className="text-3xl font-black leading-none tracking-tighter text-gray-900">
                  Modifier Utilisateur
                </h2>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#1C2434]" />
          </div>

          <form onSubmit={handleEditSubmit} className="flex h-full flex-col">
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4 sm:space-y-8 sm:px-10">
              <div className="rounded-[2rem] border border-indigo-100/60 bg-indigo-50/50 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600">
                    <UserPen size={18} />
                  </div>
                  <p className="text-xs font-bold text-indigo-700">
                    Modifie les informations de <span className="font-black">{selectedUserName || "cet utilisateur"}</span>.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Nom</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black outline-none transition-all focus:border-indigo-500/20 focus:bg-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black outline-none transition-all focus:border-indigo-500/20 focus:bg-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Téléphone</label>
                <input
                  type="text"
                  value={editForm.telephone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, telephone: e.target.value }))}
                  className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black outline-none transition-all focus:border-indigo-500/20 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-50 bg-white p-6 sm:flex-row sm:items-center sm:gap-4 sm:p-10">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="h-14 rounded-2xl border-2 border-gray-100 px-6 text-[11px] font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-gray-50 sm:h-16 sm:px-8"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={savingId === `edit-${selectedUserId}`}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1C2434] text-[12px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-indigo-600 disabled:opacity-50 sm:h-16"
              >
                {savingId === `edit-${selectedUserId}` ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => {
          if (savingId?.startsWith("delete-")) return;
          setDeleteTarget(null);
        }}
        className="max-w-md rounded-[32px] p-8"
        showCloseButton
      >
        {deleteTarget && (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 size={28} />
            </div>
            <h3 className="mb-2 text-xl font-black tracking-tight text-[#1C2434]">
              Supprimer cet utilisateur ?
            </h3>
            <p className="text-sm font-medium text-gray-500">
              <span className="font-black text-[#1C2434]">{deleteTarget.name}</span>
            </p>
            <p className="mt-4 text-sm text-gray-400">
              Cette action est définitive. Le compte sera retiré de la liste des utilisateurs.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={!!savingId?.startsWith("delete-")}
                className="h-12 rounded-full border border-gray-200 px-8 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteUser()}
                disabled={!!savingId?.startsWith("delete-")}
                className="h-12 rounded-full bg-red-600 px-8 text-[11px] font-black uppercase tracking-widest text-white transition-colors hover:bg-red-700 disabled:opacity-40"
              >
                {savingId?.startsWith("delete-") ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={passwordModalOpen}
        onClose={() => {
          setPasswordModalOpen(false);
          setSelectedUserId(null);
          setSelectedUserName("");
          setPasswordForm({ password: "", confirmPassword: "" });
        }}
        position="right"
        className="w-full max-w-xl overflow-hidden rounded-l-[2rem] bg-white shadow-[-30px_0_60px_rgba(0,0,0,0.1)] sm:rounded-l-[3rem]"
      >
        <div className="flex max-h-[100dvh] flex-col">
          <div className="p-6 pb-4 sm:p-10 sm:pb-6">
            <div className="mb-8 flex items-start justify-between">
              <div>
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 underline decoration-2 underline-offset-4">
                  Sécurité
                </span>
                <h2 className="text-3xl font-black leading-none tracking-tighter text-gray-900">
                  Réinitialiser Mot de Passe
                </h2>
              </div>
              <button
                onClick={() => setPasswordModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#1C2434]" />
          </div>

          <form onSubmit={handlePasswordSubmit} className="flex h-full flex-col">
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4 sm:space-y-8 sm:px-10">
              <div className="rounded-[2rem] border border-indigo-100/60 bg-indigo-50/50 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600">
                    <KeyRound size={18} />
                  </div>
                  <p className="text-xs font-bold text-indigo-700">
                    Utilisateur: <span className="font-black">{selectedUserName || "-"}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black outline-none transition-all focus:border-indigo-500/20 focus:bg-white"
                  required
                />
                {passwordForm.password.length > 0 && passwordForm.password.length < 8 && (
                  <p className="ml-2 mt-1 text-[10px] font-bold italic text-red-500">Le mot de passe doit contenir au moins 8 caractères.</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Confirmer mot de passe</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black outline-none transition-all focus:border-indigo-500/20 focus:bg-white"
                  required
                />
                {passwordForm.confirmPassword.length > 0 &&
                  passwordForm.password !== passwordForm.confirmPassword && (
                    <p className="ml-2 mt-1 text-[10px] font-bold italic text-red-500">La confirmation ne correspond pas au mot de passe.</p>
                  )}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-50 bg-white p-6 sm:flex-row sm:items-center sm:gap-4 sm:p-10">
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="h-14 rounded-2xl border-2 border-gray-100 px-6 text-[11px] font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-gray-50 sm:h-16 sm:px-8"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={
                  savingId === "reset-password" ||
                  passwordForm.password.length < 8 ||
                  passwordForm.password !== passwordForm.confirmPassword
                }
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1C2434] text-[12px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-indigo-600 disabled:opacity-50 sm:h-16"
              >
                {savingId === "reset-password" ? "Traitement..." : "Confirmer"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}