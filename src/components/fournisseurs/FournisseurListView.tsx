import { Edit3, Trash2, Phone, MapPin, Hash, Globe2 ,ShieldCheck} from "lucide-react";
import { TableFournisseur } from "@/types/fournisseur";
import { ResponsiveTableWrap } from "@/components/ui/ResponsiveTableWrap";

interface Props {
  rows: TableFournisseur[];
  onEdit: (f: TableFournisseur) => void;  
  onDelete: (id: string | number) => void;
}

export const FournisseurListView = ({ rows, onEdit, onDelete }: Props) => (
  <div className="min-w-0 flex-1 overflow-auto">
    <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
      <ResponsiveTableWrap>
      <table className="w-full min-w-[880px] text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            <th className="px-6 py-5">Identité Fournisseur</th>
             <th className="px-6 py-5">Representant & Role</th>

            <th className="px-6 py-5 text-center">Statut</th>
            <th className="px-6 py-5">Contact</th>
            <th className="px-6 py-5">Localisation GPS</th>
            <th className="px-6 py-5 text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-50">
          {rows.map((f) => (
            <tr key={f.id} className="hover:bg-gray-50/50 group transition-all duration-300">
              {/* CELLULE IDENTITÉ */}
              <td className="px-6 py-6">
                <div className="flex items-center gap-4">
                  <LogoAvatar logo={f.logo} raisonSociale={f.raison_sociale} />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-gray-900 uppercase tracking-tighter leading-tight">
                      {f.raison_sociale}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mt-1">
                      <ShieldCheck size={10} className="text-[#00A09D]" /> 
                      MF: {f.matricule_fiscale || "Non défini"}
                    </span>
                  </div>
                </div>
              </td>
          <td className="px-6 py-6">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-gray-900 uppercase tracking-tighter leading-tight">
                      {f.representant_nom || "—"}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mt-1">
                      <ShieldCheck size={10} className="text-[#00A09D]" /> 
                      Rôle: {f.representant_role || "Non défini"}
                    </span>
                  </div>
                </div>
              </td>
              {/* CELLULE STATUT */}
              <td className="px-6 py-3 text-center">
                <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${
                  f.statut === "ACTIF" 
                    ? "bg-green-50 text-green-600 border-green-100" 
                    : "bg-red-50 text-red-600 border-red-100"
                }`}>
                  {f.statut}
                </span>
              </td>

              {/* CELLULE CONTACT & FISCAL */}
              <td className="px-6 py-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                    <Hash size={12} className="text-gray-300" />
                    <span className="font-mono">{f.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone size={12} className="text-[#00A09D]" />
                    {f.telephone || "—"}
                  </div>
                </div>
              </td>

              {/* CELLULE GÉOLOCALISATION (Les nouveaux attributs) */}
              <td className="px-6 py-3">
                <div className="max-w-[200px] group/geo cursor-help">
                  {f.latitude ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase">
                        <Globe2 size={10} /> {f.latitude.toFixed(4)}, {f.longitude?.toFixed(4)}
                      </div>
                      <div className="text-[11px] text-gray-600 leading-snug line-clamp-2 italic border-l-2 border-[#00A09D] pl-2">
                        {f.adresse_geocodee || f.adresse || "Localisé via GPS"}
                      </div>
                    </div>
                  ) : (
                      <div className="text-[11px] text-gray-600 leading-snug line-clamp-2 italic border-l-2 border-[#00A09D] pl-2">
                      {f.adresse || "Non géolocalisé"} 
                    </div>
                  )}
                </div>
              </td>

              {/* ACTIONS */}
              <td className="px-6 py-3 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <button onClick={() => onEdit(f)} className="p-2.5 bg-white shadow-sm border border-gray-100 rounded-xl text-gray-400 hover:text-[#00A09D] hover:scale-110 transition-all">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => onDelete(f.id)} className="p-2.5 bg-white shadow-sm border border-gray-100 rounded-xl text-gray-400 hover:text-red-500 hover:scale-110 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </ResponsiveTableWrap>
    </div>
  </div>
);
function LogoAvatar({
  logo,
  raisonSociale,
}: {
  logo?: string | null;
  raisonSociale: string;
}) {
  const letter = raisonSociale?.charAt(0)?.toUpperCase() || "F";

  // On vérifie si le logo existe ET s'il commence par http OU par data:image (Base64)
  if (logo && (logo.startsWith('http') || logo.startsWith('data:image'))) {
    return (
      <img
        src={logo}
        alt={raisonSociale}
        className="h-12 w-12 rounded-2xl object-cover border border-gray-100 bg-white shrink-0 shadow-sm transition-transform group-hover:scale-105"
        // Sécurité au cas où la chaîne base64 est corrompue
        onError={(e) => (e.currentTarget.style.display = 'none')}
      />
    );
  }

  return (
    <div className="h-12 w-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-black text-lg border border-gray-800 shrink-0 shadow-lg shadow-gray-200 group-hover:bg-[#00A09D] transition-colors duration-300">
      {letter}
    </div>
  );
}