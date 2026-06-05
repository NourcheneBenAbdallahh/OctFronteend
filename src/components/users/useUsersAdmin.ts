"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  listAdminUsers, adminCreateUser, adminUpdateUser, 
  adminUpdateUserRole, adminDeleteUser, adminSetUserActive, 
  adminResetUserPassword, type AdminUser, type AdminUsersPaginatorInfo, type UserRole 
} from "@/lib/users.api";

export function useUsersAdmin(perPage: number) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [paginatorInfo, setPaginatorInfo] = useState<AdminUsersPaginatorInfo | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { setPage(1); }, [searchDebounced, roleFilter]);
  useEffect(() => { setPage(1); }, [perPage]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, paginatorInfo: p } = await listAdminUsers(page, perPage, {
        search: searchDebounced || undefined,
        role: roleFilter || undefined,
      });
      setUsers(data);
      setPaginatorInfo(p);
    } catch (e) {
      setError("Erreur lors du chargement des utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounced, roleFilter, perPage]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleAction = async (
    id: string,
    actionFn: () => Promise<any>,
    successMsg: string,
    refreshAfter = true
  ) => {
    setSavingId(id);
    setError(null);
    setSuccess(null);
    try {
      const result = await actionFn();
      if (successMsg) {
        setSuccess(successMsg);
      }
      if (refreshAfter) {
        // Rechargement non bloquant pour garder une UI réactive.
        void loadUsers();
      }
      return result;
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue.");
      return null;
    } finally {
      setSavingId(null);
    }
  };

  const handleActionBoolean = async (
    id: string,
    actionFn: () => Promise<any>,
    successMsg: string,
    refreshAfter = true
  ) => {
    const result = await handleAction(id, actionFn, successMsg, refreshAfter);
    if (result === null || result === false) {
      return false;
    }
    return true;
  };

  return {
    users, paginatorInfo, page, setPage, searchInput, setSearchInput,
    roleFilter, setRoleFilter, loading, savingId, error, success,
    setError, setSuccess, handleAction: handleActionBoolean, loadUsers
  };
}