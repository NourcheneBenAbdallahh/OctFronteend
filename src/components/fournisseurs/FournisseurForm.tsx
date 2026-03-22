import React from "react";
import { TableFournisseur } from "@/lib/fournisseurs.api";

interface Props {
  isOpen: boolean;
  editing: boolean;
  form: Partial<TableFournisseur>;
  setForm: React.Dispatch<React.SetStateAction<Partial<TableFournisseur>>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export const FournisseurForm = ({
  isOpen,
  editing,
  form,
  setForm,
  onClose,
  onSubmit,
  loading,
}: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {editing ? "Modifier Fournisseur" : "Nouveau Fournisseur"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Identité, contact, statut et informations de géolocalisation.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-[#F8F9FA]">
          <div className="bg-white p-8 shadow-sm border border-gray-200 rounded-2xl space-y-8">
            <div className="border-b border-gray-200 pb-6">
              <label className="text-[10px] font-bold text-[#00A09D] uppercase tracking-widest mb-1 block">
                Raison Sociale
              </label>
              <input
                required
                className="w-full text-4xl font-extrabold border-none p-0 focus:ring-0 placeholder:text-gray-200 text-gray-800 bg-transparent outline-none uppercase"
                value={form.raison_sociale ?? ""}
                onChange={(e) =>
                  setForm({ ...form, raison_sociale: e.target.value })
                }
                placeholder="NOM DE L'ENTREPRISE"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-6">
                <SectionTitle>Informations générales</SectionTitle>

                <Field
                  label="Logo (URL ou chemin)"
                  value={form.logo}
                  onChange={(v: string) => setForm({ ...form, logo: v })}
                  placeholder="/images/fournisseurs/logo.png"
                />

                <Field
                  label="Matricule Fiscale"
                  value={form.matricule_fiscale}
                  onChange={(v: string) =>
                    setForm({ ...form, matricule_fiscale: v })
                  }
                  required
                />

                <Field
                  label="Téléphone"
                  value={form.telephone}
                  onChange={(v: string) => setForm({ ...form, telephone: v })}
                />

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Statut
                  </label>
                  <select
                    className="border-b border-gray-300 py-2 text-sm bg-transparent outline-none focus:border-[#00A09D]"
                    value={form.statut ?? "ACTIF"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        statut: e.target.value as "ACTIF" | "INACTIF",
                      })
                    }
                  >
                    <option value="ACTIF">ACTIF</option>
                    <option value="INACTIF">INACTIF</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Adresse
                  </label>
                  <textarea
                    className="border border-gray-200 p-3 text-sm bg-gray-50 rounded-xl outline-none focus:border-[#00A09D] min-h-[90px]"
                    value={form.adresse ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, adresse: e.target.value })
                    }
                    placeholder="Adresse principale du fournisseur"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <SectionTitle>Géolocalisation</SectionTitle>

                <Field
                  label="Latitude"
                  type="number"
                  step="0.0000001"
                  value={form.latitude}
                  onChange={(v: string) =>
                    setForm({
                      ...form,
                      latitude: v === "" ? null : Number(v),
                    })
                  }
                  placeholder="36.8065"
                />

                <Field
                  label="Longitude"
                  type="number"
                  step="0.0000001"
                  value={form.longitude}
                  onChange={(v: string) =>
                    setForm({
                      ...form,
                      longitude: v === "" ? null : Number(v),
                    })
                  }
                  placeholder="10.1815"
                />

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Adresse géocodée
                  </label>
                  <textarea
                    className="border border-gray-200 p-3 text-sm bg-gray-50 rounded-xl outline-none focus:border-[#00A09D] min-h-[90px]"
                    value={form.adresse_geocodee ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, adresse_geocodee: e.target.value })
                    }
                    placeholder="Adresse normalisée issue du géocodage"
                  />
                </div>

                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
                    Prévisualisation logo
                  </div>

                  <div className="flex items-center gap-4">
                    <LogoPreview 
                      logo={form.logo ?? null}
                      raison_sociale={form.raison_sociale ?? "F"}
                    />
                   
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-4 border-t flex justify-end gap-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border rounded-xl font-bold text-gray-600 uppercase text-xs hover:bg-gray-50"
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2 bg-[#00A09D] text-white rounded-xl font-bold uppercase text-xs shadow-md hover:bg-[#008784] disabled:opacity-50"
          >
            {loading ? "Enregistrement..." : "Sauvegarder"}
          </button>
        </div>
      </form>
    </div>
  );
};

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  step,
  placeholder,
}: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
      <input
        required={required}
        type={type}
        step={step}
        placeholder={placeholder}
        className="border-b border-gray-300 py-2 focus:border-[#00A09D] outline-none text-sm bg-transparent"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm font-bold uppercase tracking-wider text-[#00A09D] border-b border-gray-100 pb-2">
      {children}
    </div>
  );
}

function LogoPreview({
  logo,
  raison_sociale,
}: {
  logo: string | null;
  raison_sociale: string;
}) {
  const letter = raison_sociale?.charAt(0)?.toUpperCase() || "F";

  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={logo}
        alt={raison_sociale}
        className="h-16 w-16 rounded-full object-cover border border-gray-200 bg-white"
      />
    );
  }

  return (
    <div className="h-16 w-16 rounded-full bg-[#00A09D] text-white flex items-center justify-center font-black text-xl border border-[#00A09D]/20">
      {letter}
    </div>
  );
}