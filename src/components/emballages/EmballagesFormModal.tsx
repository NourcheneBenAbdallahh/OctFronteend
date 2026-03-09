"use client";

import { useState, useEffect } from "react";
import {
  createEmballages,
  updateEmballages
  
} from "@/lib/emballages.api";
import {TableEmballages ,  Emballages as APIEmballages,  normalizeEmballages,

  } from "@/types/emballage";
type Status = "ACTIVE" | "INACTIVE";

interface Props {
  editing: TableEmballages | null;
  setRows: React.Dispatch<React.SetStateAction<TableEmballages[]>>;
  onClose: () => void;
}

export default function EmballagesFormModal({
  editing,
  setRows,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);

  const emptyForm = {
    code: "",
    name: "",
    type: "",
    capacity_value: undefined as number | undefined,
    capacity_unit: "",
    material: "",
    status: "ACTIVE" as Status,
  };

  const [form, setForm] = useState<Partial<TableEmballages>>(emptyForm);

  useEffect(() => {
    if (editing) {
      setForm(editing);
    } else {
      setForm(emptyForm);
    }
  }, [editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (editing) {
        const { id, code, created_at, updated_at, ...raw } = form;

        const input: Partial<APIEmballages> = {
          name: raw.name,
          type: raw.type,
          capacity_value: raw.capacity_value ?? null,
          capacity_unit: raw.capacity_unit ?? null,
          material: raw.material ?? null,
          status: raw.status ?? "ACTIVE",
        };

        const res = await updateEmballages(editing.id, input);
        const updated = normalizeEmballages(res.updateEmballage);

        setRows((prev) =>
          prev.map((r) => (String(r.id) === String(updated.id) ? updated : r))
        );
      } else {
        const res = await createEmballages(
          form as Partial<APIEmballages> & {
            code: string;
            name: string;
            type: string;
          }
        );

        const created = normalizeEmballages(res.createEmballage);

        setRows((prev) => [created, ...prev]);
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
      >
        <div className="mb-5 flex justify-between">
          <h3 className="text-lg font-semibold">
            {editing ? "Edit Emballage" : "New Emballage"}
          </h3>

          <button type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">

          {/* Code */}
          <input
            placeholder="Code"
            value={form.code ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, code: e.target.value }))
            }
            disabled={!!editing}
            className="border p-2 rounded"
            required
          />

          {/* Name */}
          <input
            placeholder="Name"
            value={form.name ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, name: e.target.value }))
            }
            className="border p-2 rounded"
            required
          />

          {/* Type */}
          <input
            placeholder="Type"
            value={form.type ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, type: e.target.value }))
            }
            className="border p-2 rounded"
            required
          />

          {/* Material */}
          <input
            placeholder="Material"
            value={form.material ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, material: e.target.value }))
            }
            className="border p-2 rounded"
          />

          {/* Capacity value */}
          <input
            type="number"
            placeholder="Capacity"
            value={form.capacity_value ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                capacity_value: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              }))
            }
            className="border p-2 rounded"
          />

          {/* Capacity unit */}
          <input
            placeholder="Unit"
            value={form.capacity_unit ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, capacity_unit: e.target.value }))
            }
            className="border p-2 rounded"
          />

          {/* Status */}
          <select
            value={form.status ?? "ACTIVE"}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.target.value as Status }))
            }
            className="border p-2 rounded col-span-2"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>

        </div>

        <div className="flex justify-end gap-2 mt-6">

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-brand-500 text-white rounded"
          >
            {loading ? "Saving..." : "Save"}
          </button>

        </div>
      </form>
    </div>
  );
}