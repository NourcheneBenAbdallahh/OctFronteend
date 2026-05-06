import React from "react";
import { AdminUser, UserRole } from "@/lib/users.api";
import { Check, ChevronDown, ChevronUp, KeyRound, Pencil, Power, Trash2 } from "lucide-react";

interface UserRowProps {
  user: AdminUser;
  isMe: boolean;
  savingId: string | null;
  onUpdateRole: (id: string, role: UserRole) => void;
  onToggleActive: (u: AdminUser) => void;
  onEdit: (u: AdminUser) => void;
  onPwd: (u: AdminUser) => void;
  onDelete: (id: string, name: string) => void;
  roleFr: (r: string) => string;
  roleOptions: UserRole[];
}

export const UserRow = ({ 
  user, isMe, savingId, onUpdateRole, onToggleActive, 
  onEdit, onPwd, onDelete, roleFr, roleOptions 
}: UserRowProps) => {
  const isSaving = !!savingId && (savingId.includes(String(user.id)) || savingId === "reset-password");
  const [roleOpen, setRoleOpen] = React.useState(false);
  const [roleSearch, setRoleSearch] = React.useState("");

  const filteredRoles = roleOptions.filter((r) =>
    roleFr(r).toLowerCase().includes(roleSearch.toLowerCase())
  );

  return (
    <tr className="group align-middle transition-all hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
      <td className="px-8 py-6">
        {user.photo ? (
          <img src={user.photo} alt={user.name} className="h-9 w-9 rounded-full border border-gray-200 object-cover dark:border-gray-700" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xs font-bold text-gray-500 dark:border-gray-700 dark:bg-gray-800">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        )}
      </td>
      <td className="px-8 py-6">
        <div className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white">{user.name}</div>
      </td>
      <td className="px-8 py-6">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{user.email}</div>
        <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-indigo-500">
          {user.telephone || "Sans téléphone"}
        </div>
      </td>
      <td className="px-8 py-6">
        <div className="relative">
          <button
            type="button"
            onClick={() => setRoleOpen((prev) => !prev)}
            disabled={isSaving}
            className="inline-flex min-w-[130px] items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition-all hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <span className="truncate">{roleFr(String(user.role))}</span>
            {roleOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {roleOpen && (
            <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-900">
              <input
                type="text"
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                placeholder="Rechercher rôle..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800"
              />
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1 pr-1">
                {filteredRoles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRoleOpen(false);
                      setRoleSearch("");
                      onUpdateRole(String(user.id), r);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all ${
                      String(user.role).toUpperCase() === String(r).toUpperCase()
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span>{roleFr(r)}</span>
                    {String(user.role).toUpperCase() === String(r).toUpperCase() ? (
                      <Check size={12} />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </td>
      <td className="px-8 py-6 text-center">
        <span className={`rounded-xl border px-4 py-1.5 text-[9px] font-black uppercase tracking-widest ${
          user.isActive ? "border-green-100 bg-green-50 text-green-600" : "border-red-100 bg-red-50 text-red-600"
        }`}>
          {user.isActive ? "ACTIVE" : "INACTIVE"}
        </span>
      </td>
      <td className="px-8 py-6 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => onEdit(user)}
            disabled={isSaving}
            title="Modifier utilisateur"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-all hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <Pencil size={12} />
          </button>
          <button 
            onClick={() => onToggleActive(user)} 
            disabled={isMe || isSaving}
            title={user.isActive ? "Désactiver le compte" : "Activer le compte"}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all disabled:opacity-30 ${
              user.isActive
                ? "border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                : "border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
            }`}
          >
            <Power size={12} />
          </button>
          <button
            onClick={() => onPwd(user)}
            disabled={isSaving}
            title="Réinitialiser mot de passe"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-all hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          >
            <KeyRound size={12} />
          </button>
          <button 
            onClick={() => onDelete(String(user.id), user.name)} 
            disabled={isMe || isSaving}
            title="Supprimer utilisateur"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 transition-all hover:bg-red-100 disabled:opacity-30"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
};