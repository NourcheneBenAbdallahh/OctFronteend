"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BoxSelect, UserPlus, UserPen, KeyRound, Trash2, X } from "lucide-react";
import { UsersHeader } from "./UsersHeader";
import { Modal } from "@/components/ui/modal";
import { TablePagination } from "@/components/ui/TablePagination";
import { useAuthStore } from "@/store/useAuthStore";
import { useUsersAdmin } from "./useUsersAdmin";
import { UserRow } from "./UserRow";
import { RoleSearchableDropdown } from "./RoleSearchableDropdown";
import { 
  AssignableUserRole, adminDeleteUser, adminUpdateUserRole, 
  adminSetUserActive, adminCreateUser, adminUpdateUser, adminResetUserPassword,
  findAdminUserPage,
} from "@/lib/users.api";
import { ASSIGNABLE_USER_ROLES, roleDisplayLabel } from "@/lib/access";
import { AppFeedbackBanner } from "@/components/ui/feedback";
import {
  PasswordResetEmailSentModal,
  type PasswordResetEmailSentInfo,
} from "./PasswordResetEmailSentModal";
import { ResponsiveTableWrap } from "@/components/ui/ResponsiveTableWrap";
import { SortableTh } from "@/components/ui/SortableTableHeader";
import { useTableSort } from "@/hooks/useTableSort";
import type { SortColumn } from "@/lib/tableSort";
import type { AdminUser } from "@/lib/users.api";

const ROLE_OPTIONS = ASSIGNABLE_USER_ROLES;
const roleFr = roleDisplayLabel;

const USER_SORT_COLUMNS: Record<string, SortColumn<AdminUser>> = {
  name: { accessor: (u) => u.name, type: "string" },
  email: { accessor: (u) => u.email, type: "string" },
  role: { accessor: (u) => u.role, type: "string" },
  statut: { accessor: (u) => (u.isActive ? 1 : 0), type: "number" },
};

export default function UsersAdminPage() {
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus");
  const [perPage, setPerPage] = useState(15);
  const me = useAuthStore((s) => s.user);
  const {
    users, paginatorInfo, page, setPage, searchInput, setSearchInput,
    roleFilter, setRoleFilter, loading, savingId, error, success, handleAction,
    setError, setSuccess,
  } = useUsersAdmin(perPage);

  const { sortKey, sortDirection, toggleSort, sortRows } = useTableSort(USER_SORT_COLUMNS);
  const sortedUsers = useMemo(
    () => sortRows(users),
    [users, sortRows]
  );

  useEffect(() => {
    if (!focusId) return;
    setSearchInput("");
    setRoleFilter("");
  }, [focusId, setSearchInput, setRoleFilter]);

  useEffect(() => {
    if (!focusId) return;

    let cancelled = false;
    void (async () => {
      try {
        const targetPage = await findAdminUserPage(focusId, perPage, {});
        if (cancelled || targetPage == null) return;
        setPage(targetPage);
      } catch {
        // ignore — la liste reste sur la page courante
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [focusId, perPage, setPage]);

  useEffect(() => {
    if (!focusId) return;
    const isVisible = users.some((user) => String(user.id) === String(focusId));
    if (!isVisible) return;

    const timer = window.setTimeout(() => {
      document.getElementById(`user-row-${focusId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 180);

    return () => window.clearTimeout(timer);
  }, [focusId, users, page]);

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
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [passwordEmailSentInfo, setPasswordEmailSentInfo] =
    useState<PasswordResetEmailSentInfo | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    telephone: "",
    role: "STOCK" as AssignableUserRole,
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
      "Utilisateur créé avec succès. Un email avec les identifiants d'accès a été envoyé."
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

  const openPasswordModal = (user: AdminUser) => {
    setSelectedUserId(String(user.id));
    setSelectedUserName(user.name ?? "");
    setSelectedUserEmail(user.email ?? "");
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

    const newPassword = passwordForm.password;

    const ok = await handleAction(
      "reset-password",
      () => adminResetUserPassword(selectedUserId, newPassword),
      ""
    );

    if (ok) {
      setSuccess(null);
      setPasswordEmailSentInfo({
        userName: selectedUserName || "l'utilisateur",
        userEmail: selectedUserEmail,
        password: newPassword,
      });
      setPasswordModalOpen(false);
      setSelectedUserId(null);
      setSelectedUserName("");
      setSelectedUserEmail("");
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

  const totalUsers = paginatorInfo?.total ?? users.length;

  return (
    <div className="flex min-h-[600px] flex-col">
      <UsersHeader
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        roleOptions={ROLE_OPTIONS}
        roleFr={roleFr}
        onOpenNew={() => setCreateModalOpen(true)}
        total={totalUsers}
        perPage={perPage}
        setPerPage={setPerPage}
      />

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
                  <SortableTh columnKey="name" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-8 py-6">Utilisateur</SortableTh>
                  <SortableTh columnKey="email" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-8 py-6">Contact</SortableTh>
                  <SortableTh columnKey="role" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-8 py-6">Rôle</SortableTh>
                  <SortableTh columnKey="statut" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-8 py-6" align="center">Statut</SortableTh>
                  <th className="px-8 py-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedUsers.map((u) => (
                  <UserRow 
                    key={u.id}
                    user={u}
                    focusedId={focusId}
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
        showCloseButton={false}
        className="w-full max-w-xl rounded-l-[2rem] bg-white shadow-[-30px_0_60px_rgba(0,0,0,0.1)] sm:max-w-lg sm:rounded-l-[3rem]"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 border-b border-gray-50 px-5 py-5 sm:px-8 sm:py-7">
            <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5">
              <div className="min-w-0">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 underline decoration-2 underline-offset-4">
                  Gestion Utilisateurs
                </span>
                <h2 className="text-2xl font-black leading-tight tracking-tighter text-gray-900 sm:text-3xl">
                  Nouvel Utilisateur
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCreateModalOpen(false);
                  resetCreateForm();
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="h-1 w-full rounded-full bg-[#1C2434] sm:h-1.5" />
          </div>

          <form onSubmit={handleCreateSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="form-scroll min-h-0 flex-1 space-y-4 px-5 py-4 sm:space-y-5 sm:px-8 sm:py-5">
              <div className="rounded-2xl border border-indigo-100/60 bg-indigo-50/50 p-4 sm:rounded-[1.5rem] sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 sm:h-10 sm:w-10">
                    <UserPlus size={18} />
                  </div>
                  <p className="text-xs font-bold leading-snug text-indigo-700">
                    Crée un compte avec rôle et accès immédiats.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Nom</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full min-w-0 rounded-2xl border-2 border-gray-50 bg-gray-50 px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-indigo-500/20 focus:bg-white sm:text-xs sm:font-black"
                    placeholder="Nom complet"
                    required
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Email</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full min-w-0 rounded-2xl border-2 border-gray-50 bg-gray-50 px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-indigo-500/20 focus:bg-white sm:text-xs sm:font-black"
                    placeholder="utilisateur@domaine.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Téléphone</label>
                  <input
                    type="text"
                    value={createForm.telephone}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, telephone: e.target.value }))}
                    className="w-full min-w-0 rounded-2xl border-2 border-gray-50 bg-gray-50 px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-indigo-500/20 focus:bg-white sm:text-xs sm:font-black"
                    placeholder="+216 ..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Rôle</label>
                  <RoleSearchableDropdown
                    value={createForm.role}
                    onChange={(r) => setCreateForm((prev) => ({ ...prev, role: r as AssignableUserRole }))}
                    options={ROLE_OPTIONS}
                    roleFr={roleFr}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Mot de passe</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full min-w-0 rounded-2xl border-2 border-gray-50 bg-gray-50 px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-indigo-500/20 focus:bg-white sm:text-xs sm:font-black"
                  placeholder="Minimum recommandé: 8 caractères"
                  required
                />
              </div>

              <label className="flex w-full items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={createForm.is_active}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 shrink-0 rounded border-gray-300"
                />
                Compte actif à la création
              </label>
            </div>

            <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:gap-4 sm:px-8 sm:py-5">
              <button
                type="button"
                onClick={() => {
                  setCreateModalOpen(false);
                  resetCreateForm();
                }}
                className="h-12 rounded-2xl border-2 border-gray-100 px-6 text-[11px] font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-gray-50 sm:h-14 sm:px-8"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={savingId === "create-user"}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1C2434] text-[11px] font-black uppercase tracking-[0.15em] text-white shadow-xl transition-all hover:bg-indigo-600 disabled:opacity-50 sm:h-14 sm:text-[12px] sm:tracking-[0.2em]"
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
        showCloseButton={false}
        className="w-full max-w-xl rounded-l-[2rem] bg-white shadow-[-30px_0_60px_rgba(0,0,0,0.1)] sm:max-w-lg sm:rounded-l-[3rem]"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 border-b border-gray-50 px-5 py-5 sm:px-8 sm:py-7">
            <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5">
              <div className="min-w-0">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 underline decoration-2 underline-offset-4">
                  Gestion Utilisateurs
                </span>
                <h2 className="text-2xl font-black leading-tight tracking-tighter text-gray-900 sm:text-3xl">
                  Modifier Utilisateur
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="h-1 w-full rounded-full bg-[#1C2434] sm:h-1.5" />
          </div>

          <form onSubmit={handleEditSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="form-scroll min-h-0 flex-1 space-y-4 px-5 py-4 sm:space-y-5 sm:px-8 sm:py-5">
              <div className="rounded-2xl border border-indigo-100/60 bg-indigo-50/50 p-4 sm:rounded-[1.5rem] sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 sm:h-10 sm:w-10">
                    <UserPen size={18} />
                  </div>
                  <p className="text-xs font-bold leading-snug text-indigo-700">
                    Modifie les informations de <span className="font-black">{selectedUserName || "cet utilisateur"}</span>.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Nom</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full min-w-0 rounded-2xl border-2 border-gray-50 bg-gray-50 px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-indigo-500/20 focus:bg-white sm:text-xs sm:font-black"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full min-w-0 rounded-2xl border-2 border-gray-50 bg-gray-50 px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-indigo-500/20 focus:bg-white sm:text-xs sm:font-black"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Téléphone</label>
                <input
                  type="text"
                  value={editForm.telephone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, telephone: e.target.value }))}
                  className="w-full min-w-0 rounded-2xl border-2 border-gray-50 bg-gray-50 px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-indigo-500/20 focus:bg-white sm:text-xs sm:font-black"
                />
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:gap-4 sm:px-8 sm:py-5">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="h-12 rounded-2xl border-2 border-gray-100 px-6 text-[11px] font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-gray-50 sm:h-14 sm:px-8"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={savingId === `edit-${selectedUserId}`}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1C2434] text-[11px] font-black uppercase tracking-[0.15em] text-white shadow-xl transition-all hover:bg-indigo-600 disabled:opacity-50 sm:h-14 sm:text-[12px] sm:tracking-[0.2em]"
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
        showCloseButton={false}
        className="w-full max-w-xl rounded-l-[2rem] bg-white shadow-[-30px_0_60px_rgba(0,0,0,0.1)] sm:max-w-lg sm:rounded-l-[3rem]"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 border-b border-gray-50 px-5 py-5 sm:px-8 sm:py-7">
            <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5">
              <div className="min-w-0">
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 underline decoration-2 underline-offset-4">
                  Sécurité
                </span>
                <h2 className="text-2xl font-black leading-tight tracking-tighter text-gray-900 sm:text-3xl">
                  Réinitialiser Mot de Passe
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="h-1 w-full rounded-full bg-[#1C2434] sm:h-1.5" />
          </div>

          <form onSubmit={handlePasswordSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="form-scroll min-h-0 flex-1 space-y-4 px-5 py-4 sm:space-y-5 sm:px-8 sm:py-5">
              <div className="rounded-2xl border border-indigo-100/60 bg-indigo-50/50 p-4 sm:rounded-[1.5rem] sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 sm:h-10 sm:w-10">
                    <KeyRound size={18} />
                  </div>
                  <p className="text-xs font-bold leading-snug text-indigo-700">
                    Utilisateur: <span className="font-black">{selectedUserName || "-"}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full min-w-0 rounded-2xl border-2 border-gray-50 bg-gray-50 px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-indigo-500/20 focus:bg-white sm:text-xs sm:font-black"
                  required
                />
                {passwordForm.password.length > 0 && passwordForm.password.length < 8 && (
                  <p className="ml-2 mt-1 text-[10px] font-bold italic text-red-500">Le mot de passe doit contenir au moins 8 caractères.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Confirmer mot de passe</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full min-w-0 rounded-2xl border-2 border-gray-50 bg-gray-50 px-4 py-3 text-sm font-semibold outline-none transition-all focus:border-indigo-500/20 focus:bg-white sm:text-xs sm:font-black"
                  required
                />
                {passwordForm.confirmPassword.length > 0 &&
                  passwordForm.password !== passwordForm.confirmPassword && (
                    <p className="ml-2 mt-1 text-[10px] font-bold italic text-red-500">La confirmation ne correspond pas au mot de passe.</p>
                  )}
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:gap-4 sm:px-8 sm:py-5">
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="h-12 rounded-2xl border-2 border-gray-100 px-6 text-[11px] font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-gray-50 sm:h-14 sm:px-8"
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
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1C2434] text-[11px] font-black uppercase tracking-[0.15em] text-white shadow-xl transition-all hover:bg-indigo-600 disabled:opacity-50 sm:h-14 sm:text-[12px] sm:tracking-[0.2em]"
              >
                {savingId === "reset-password" ? "Traitement..." : "Confirmer"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <PasswordResetEmailSentModal
        info={passwordEmailSentInfo}
        onClose={() => setPasswordEmailSentInfo(null)}
      />
    </div>
  );
}