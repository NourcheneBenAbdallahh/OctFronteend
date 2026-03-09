"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  createEmballages,
  updateEmballages,
  deleteEmballages,
  forceDeleteEmballages,
  restoreEmballages,

} from "@/lib/emballages.api";
import Pagination from "@/components/tables/Pagination";
import { TableEmballages, Emballages as APIEmballages,normalizeEmballages } from "@/types/emballage";
type Status = "ACTIVE" | "INACTIVE";
type Id = string | number;

const ITEMS_PER_PAGE = 10;

export default function EmballagesTable({ data }: { data: TableEmballages[] }) {
  const initialRows = useMemo(() => data.map(normalizeEmballages), [data]);
  const [rows, setRows] = useState<TableEmballages[]>(initialRows);

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<TableEmballages | null>(null);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Status>("ALL");

  // Sorting
  const [sortKey, setSortKey] = useState<
    "code" | "name" | "type" | "status" | "created_at" | "updated_at"
  >("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => setRows(data.map(normalizeEmballages)), [data]);

  const formatDate = (d?: string | null) => {
    if (!d) return "-";
    const iso = d.includes("T") ? d : d.replace(" ", "T");
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleString();
  };

  const capacityLabel = (p: TableEmballages) =>
    p.capacity_value != null ? `${p.capacity_value} ${p.capacity_unit ?? ""}`.trim() : "-";

  const emptyForm = useMemo(
    () => ({
      code: "",
      name: "",
      type: "",
      capacity_value: undefined as number | undefined,
      capacity_unit: "",
      material: "",
      status: "ACTIVE" as Status,
    }),
    [],
  );

  const [form, setForm] = useState<Partial<TableEmballages>>({ ...emptyForm });

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm });
    setIsOpen(true);
  }

  function openEdit(item: TableEmballages) {
    setEditing(item);
    setForm({ ...item });
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    setEditing(null);
    setForm({ ...emptyForm });
  }

  function toggleSort(nextKey: typeof sortKey) {
    if (sortKey === nextKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(nextKey);
      setSortDir("asc");
    }
  }

  const filteredSortedRows = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = rows.filter((p) => {
      const matchesStatus = statusFilter === "ALL" ? true : p.status === statusFilter;

      if (!q) return matchesStatus;

      const haystack = [
        p.code,
        p.name,
        p.type,
        p.material ?? "",
        p.status,
        String(p.capacity_value ?? ""),
        p.capacity_unit ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && haystack.includes(q);
    });

    const getVal = (p: TableEmballages) => {
      const v = p[sortKey] as any;
      return v ?? "";
    };

    const sorted = [...filtered].sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);

      // Dates: compare via Date if looks like a timestamp string
      const isDateLike =
        sortKey === "created_at" || sortKey === "updated_at";

      let cmp = 0;
      if (isDateLike) {
        const ad = av ? new Date(String(av).replace(" ", "T")).getTime() : 0;
        const bd = bv ? new Date(String(bv).replace(" ", "T")).getTime() : 0;
        cmp = ad - bd;
      } else {
        cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
      }

      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [rows, query, statusFilter, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.ceil(filteredSortedRows.length / ITEMS_PER_PAGE);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSortedRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSortedRows, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);

    try {
      if (editing) {
        const { id, code, created_at, updated_at, ...raw } = form;

        const input: Partial<APIEmballages> = {
          name: raw.name as string,
          type: raw.type as string,
          capacity_value: raw.capacity_value as number | undefined | null,
          capacity_unit: raw.capacity_unit as string | undefined | null,
          material: raw.material as string | undefined | null,
          status: raw.status as string | undefined | null,
        };

        const res = await updateEmballages(editing.id, input);
        const updated = normalizeEmballages(res.updateEmballage);

        setRows((r) => r.map((x) => (String(x.id) === String(updated.id) ? updated : x)));
      } else {
        const res = await createEmballages(
          form as Partial<APIEmballages> & { code: string; name: string; type: string },
        );
        const created = normalizeEmballages(res.createEmballage);
        setRows((r) => [created, ...r]);
      }

      closeModal();
    } catch (err: any) {
      console.error("Create/update emballages error", err);
      // show the full stringified error so the backend message isn’t truncated
      alert(err?.message || String(err) || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: Id) {
    if (!confirm("Delete this Emballages?")) return;
    try {
      const res = await deleteEmballages(id);
      const deleted = res.deleteEmballage;
      setRows((r) => r.filter((x) => String(x.id) !== String(deleted.id)));
    } catch (err: any) {
      console.error("Delete emballages error", err);
      alert(err?.message || String(err) || "Delete failed");
    }
  }

  async function handleForceDelete(id: Id) {
    if (!confirm("Permanently delete this Emballages? This cannot be undone.")) return;
    try {
      await forceDeleteEmballages(id);
      setRows((r) => r.filter((x) => String(x.id) !== String(id)));
    } catch (err: any) {
      console.error("Force delete emballages error", err);
      alert(err?.message || String(err) || "Force delete failed");
    }
  }

  async function handleRestore(id: Id) {
    try {
      const res = await restoreEmballages(id);
      const restored = normalizeEmballages(res.restoreEmballage);
      setRows((r) => r.map((x) => (String(x.id) === String(restored.id) ? restored : x)));
    } catch (err: any) {
      console.error("Restore emballages error", err);
      alert(err?.message || String(err) || "Restore failed");
    }
  }

  const SortIcon = ({ active }: { active: boolean }) => (
    <span className={`ml-1 inline-block text-[10px] ${active ? "text-brand-600 dark:text-brand-400" : "text-gray-300 dark:text-gray-600"}`}>
      ▲▼
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Header / Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={openNew}
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-400/60"
          >
            + New Emballages
          </button>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredSortedRows.length} item(s)
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search code, name, type, material..."
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-200/60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-brand-500 dark:focus:ring-brand-500/20 sm:w-[320px]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-200/60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-brand-500 dark:focus:ring-brand-500/20"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] table-auto">
            <thead className="bg-gray-50 dark:bg-gray-950/40">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort("code")}
                    className="inline-flex items-center hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    Code <SortIcon active={sortKey === "code"} />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="inline-flex items-center hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    Name <SortIcon active={sortKey === "name"} />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort("type")}
                    className="inline-flex items-center hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    Type <SortIcon active={sortKey === "type"} />
                  </button>
                </th>
                <th className="px-4 py-3">Capacity</th>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort("created_at")}
                    className="inline-flex items-center hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    Created <SortIcon active={sortKey === "created_at"} />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort("updated_at")}
                    className="inline-flex items-center hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    Updated <SortIcon active={sortKey === "updated_at"} />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleSort("status")}
                    className="inline-flex items-center hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    Status <SortIcon active={sortKey === "status"} />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredSortedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No results found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((p) => (
                  <tr key={p.id} className="text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-950/40">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{p.code}</td>
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3">{p.type}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{capacityLabel(p)}</td>
                    <td className="px-4 py-3">{p.material ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDate(p.updated_at)}</td>

                    <td className="px-4 py-3">
                      {p.status === "ACTIVE" ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-100 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-900/30">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-100 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-900/30">
                          INACTIVE
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => handleRestore(p.id)}
                          className="rounded-md px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handleForceDelete(p.id)}
                          className="rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          Force
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <form
            onSubmit={handleSubmit}
            className="relative z-10 w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {editing ? "Edit Emballages" : "New Emballages"}
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {editing ? "Update the selected Emballages record." : "Create a new Emballages record."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Code</span>
                <input
                  value={form.code ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200/60 dark:border-gray-700 dark:bg-gray-950/30 dark:text-gray-100 dark:focus:border-brand-500 dark:focus:ring-brand-500/20"
                  required
                  disabled={!!editing} // code locked on edit
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Name</span>
                <input
                  value={form.name ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200/60 dark:border-gray-700 dark:bg-gray-950/30 dark:text-gray-100 dark:focus:border-brand-500 dark:focus:ring-brand-500/20"
                  required
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Type</span>
                <input
                  value={form.type ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200/60 dark:border-gray-700 dark:bg-gray-950/30 dark:text-gray-100 dark:focus:border-brand-500 dark:focus:ring-brand-500/20"
                  required
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Material</span>
                <input
                  value={form.material ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200/60 dark:border-gray-700 dark:bg-gray-950/30 dark:text-gray-100 dark:focus:border-brand-500 dark:focus:ring-brand-500/20"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Capacity Value</span>
                <input
                  type="number"
                  value={form.capacity_value ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      capacity_value: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200/60 dark:border-gray-700 dark:bg-gray-950/30 dark:text-gray-100 dark:focus:border-brand-500 dark:focus:ring-brand-500/20"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Capacity Unit</span>
                <input
                  value={form.capacity_unit ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, capacity_unit: e.target.value }))}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200/60 dark:border-gray-700 dark:bg-gray-950/30 dark:text-gray-100 dark:focus:border-brand-500 dark:focus:ring-brand-500/20"
                />
              </label>

              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Status</span>
                <select
                  value={(form.status ?? "ACTIVE") as Status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-200/60 dark:border-gray-700 dark:bg-gray-950/30 dark:text-gray-100 dark:focus:border-brand-500 dark:focus:ring-brand-500/20"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}