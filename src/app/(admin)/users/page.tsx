"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import {
  adminCreateUser,
  adminDeleteUser,
  adminResetUserPassword,
  adminUpdateUserRole,
  listAdminUsers,
  type AdminUser,
  type AdminUsersPaginatorInfo,
  type UserRole,
} from "@/lib/users.api";
import { useAuthStore } from "@/store/useAuthStore";

const ROLE_OPTIONS: UserRole[] = ["ADMIN", "STOCK", "LOGISTIQUE", "CONTRAT", "FINANCE"];

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrateur",
  STOCK: "Stock",
  LOGISTIQUE: "Logistique",
  CONTRAT: "Contrat",
  FINANCE: "Finance",
};

const PER_PAGE = 15;

function roleFr(role: string): string {
  return ROLE_LABEL[(role || "").toUpperCase()] ?? role;
}

export default function UsersAdminPage() {
  const me = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [paginatorInfo, setPaginatorInfo] =
    useState<AdminUsersPaginatorInfo | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STOCK" as UserRole,
  });

  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdTarget, setPwdTarget] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [searchDebounced, roleFilter]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, paginatorInfo: p } = await listAdminUsers(page, PER_PAGE, {
        search: searchDebounced || undefined,
        role: roleFilter || undefined,
      });
      setUsers(data);
      setPaginatorInfo(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounced, roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSavingId("create");
    try {
      await adminCreateUser({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
      });
      setSuccess("Utilisateur créé avec succès.");
      setCreateForm({ name: "", email: "", password: "", role: "STOCK" });
      setPage(1);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création utilisateur impossible.");
    } finally {
      setSavingId(null);
    }
  };

  const onUpdateRole = async (userId: string, role: UserRole) => {
    setError(null);
    setSuccess(null);
    setSavingId(`role-${userId}`);
    try {
      await adminUpdateUserRole(userId, role);
      setSuccess("Rôle mis à jour.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise à jour du rôle impossible.");
    } finally {
      setSavingId(null);
    }
  };

  const onDeleteUser = async (userId: string, userName: string) => {
    const ok = window.confirm(`Supprimer l'utilisateur "${userName}" ?`);
    if (!ok) return;
    setError(null);
    setSuccess(null);
    setSavingId(`delete-${userId}`);
    try {
      await adminDeleteUser(userId);
      setSuccess("Utilisateur supprimé.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible.");
    } finally {
      setSavingId(null);
    }
  };

  const openPwdModal = (u: AdminUser) => {
    setError(null);
    setPwdTarget(u);
    setNewPassword("");
    setConfirmPassword("");
    setPwdModalOpen(true);
  };

  const closePwdModal = () => {
    setPwdModalOpen(false);
    setPwdTarget(null);
    setNewPassword("");
    setConfirmPassword("");
  };

  const submitPwdReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdTarget) return;
    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setError(null);
    setSuccess(null);
    setSavingId(`pwd-${pwdTarget.id}`);
    try {
      await adminResetUserPassword(pwdTarget.id, newPassword);
      setSuccess("Mot de passe réinitialisé.");
      closePwdModal();
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Réinitialisation impossible.");
    } finally {
      setSavingId(null);
    }
  };

  const lastPage = paginatorInfo?.lastPage ?? 1;
  const total = paginatorInfo?.total ?? 0;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00A09D]">
          Administration
        </p>
        <h1 className="mt-2 text-2xl font-black text-[#1C2434] dark:text-white">
          Gestion des utilisateurs
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Créez des comptes, filtrez la liste, changez les rôles, réinitialisez les mots de
          passe et supprimez des utilisateurs.
        </p>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-sm font-black uppercase tracking-wide text-[#1C2434] dark:text-white">
          Créer un utilisateur
        </h2>
        <form onSubmit={onCreateUser} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          <input
            type="text"
            value={createForm.name}
            onChange={(e) => setCreateForm((v) => ({ ...v, name: e.target.value }))}
            placeholder="Nom complet"
            required
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
          <input
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm((v) => ({ ...v, email: e.target.value }))}
            placeholder="email@entreprise.tn"
            required
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
          <input
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm((v) => ({ ...v, password: e.target.value }))}
            placeholder="Mot de passe (min 8)"
            minLength={8}
            required
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
          <select
            value={createForm.role}
            onChange={(e) =>
              setCreateForm((v) => ({ ...v, role: e.target.value as UserRole }))
            }
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {roleFr(r)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={savingId === "create"}
            className="rounded-xl bg-[#00A09D] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {savingId === "create" ? "Création..." : "Créer"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-wide text-[#1C2434] dark:text-white">
            Utilisateurs
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher nom ou email..."
              className="min-w-[200px] rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="">Tous les rôles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {roleFr(r)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={loadUsers}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold dark:border-gray-700"
            >
              {loading ? "Chargement..." : "Actualiser"}
            </button>
          </div>
        </div>

        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          {total > 0 ? (
            <>
              {total} compte{total !== 1 ? "s" : ""} au total · page {page} / {lastPage} (
              {PER_PAGE}/page)
            </>
          ) : (
            <>Aucun résultat</>
          )}
        </p>

        {error ? (
          <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
        {success ? (
          <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left dark:border-gray-800">
                <th className="py-2 pr-3">Nom</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Rôle</th>
                <th className="py-2 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-3 font-medium">{u.name}</td>
                  <td className="py-2 pr-3">{u.email}</td>
                  <td className="py-2 pr-3">
                    <select
                      value={String(u.role).toUpperCase()}
                      onChange={(e) => onUpdateRole(String(u.id), e.target.value as UserRole)}
                      disabled={savingId === `role-${u.id}`}
                      className="rounded-lg border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-800"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {roleFr(r)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openPwdModal(u)}
                        disabled={!!savingId}
                        className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold dark:border-gray-700"
                      >
                        Mot de passe
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteUser(String(u.id), u.name)}
                        disabled={
                          String(u.id) === String(me?.id) || savingId === `delete-${u.id}`
                        }
                        className="rounded-lg border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">
                    Aucun utilisateur ne correspond aux critères.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {lastPage > 1 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-50 dark:border-gray-700"
            >
              Précédent
            </button>
            <span className="text-xs text-gray-500">
              Page {page} / {lastPage}
            </span>
            <button
              type="button"
              disabled={page >= lastPage || loading}
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-50 dark:border-gray-700"
            >
              Suivant
            </button>
          </div>
        ) : null}
      </section>

      <Modal
        isOpen={pwdModalOpen}
        onClose={closePwdModal}
        className="max-w-md p-6"
      >
        <h3 className="text-lg font-black text-[#1C2434] dark:text-white">
          Réinitialiser le mot de passe
        </h3>
        {pwdTarget ? (
          <p className="mt-1 text-sm text-gray-500">
            {pwdTarget.name} · {pwdTarget.email}
          </p>
        ) : null}
        <form onSubmit={submitPwdReset} className="mt-6 space-y-3">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nouveau mot de passe (min 8)"
            minLength={8}
            required
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirmer le mot de passe"
            minLength={8}
            required
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closePwdModal}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold dark:border-gray-700"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!!savingId}
              className="rounded-lg bg-[#00A09D] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {savingId?.startsWith("pwd-") ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
