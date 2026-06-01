"use client";
import React, { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { updateProfile } from "@/lib/auth.api";
import { getActionErrorMessage } from "@/hooks/useAppFeedback";
import { useAuthStore } from "@/store/useAuthStore";
import { countryLabel, DEFAULT_COUNTRY_CODE } from "@/lib/countries";
import { CountrySearchablePicker } from "./CountrySearchablePicker";

export default function UserAddressCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { user, token, patchUser } = useAuthStore();

  const [country, setCountry] = useState(DEFAULT_COUNTRY_CODE);
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCountry(user?.country ?? DEFAULT_COUNTRY_CODE);
    setCity(user?.city ?? "");
    setPostalCode(user?.postalCode ?? "");
    setFeedback(null);
    setError(false);
  }, [isOpen, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setFeedback(null);
    setError(false);

    try {
      const updated = await updateProfile(
        {
          country: country || null,
          city: city.trim() || null,
          postal_code: postalCode.trim() || null,
        },
        token
      );
      patchUser(updated);
      setFeedback("Adresse mise à jour.");
      setTimeout(() => closeModal(), 600);
    } catch (err) {
      setError(true);
      setFeedback(getActionErrorMessage(err, "Impossible de mettre à jour l'adresse."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="p-6 bg-white border-2 border-gray-100 rounded-[30px] shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-8 bg-[#00A09D] rounded-full"></div>
              <h4 className="text-xl font-[1000] uppercase tracking-tighter text-[#1C2434] dark:text-white">
                Informations de Localisation
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <AddressInfo label="Pays" value={countryLabel(user?.country)} />
              <AddressInfo label="Ville / Gouvernorat" value={user?.city || "Non renseigné"} />
              <AddressInfo label="Code postal" value={user?.postalCode || "Non renseigné"} />
            </div>
          </div>

          <button
            type="button"
            onClick={openModal}
            className="flex items-center justify-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[#00A09D] transition-all bg-emerald-50 rounded-full hover:bg-[#00A09D] hover:text-white group"
          >
            Modifier
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px]">
        <div className="relative w-full max-h-[90vh] overflow-y-auto p-8 bg-white rounded-[35px] no-scrollbar dark:bg-[#1C2434]">
          <div className="mb-10">
            <h4 className="text-3xl font-[1000] uppercase tracking-tighter text-[#1C2434] dark:text-white mb-2">
              Éditer l&apos;adresse
            </h4>
            <div className="h-1.5 w-12 bg-[#00A09D] rounded-full"></div>
          </div>

          <form onSubmit={handleSave} className="space-y-6" autoComplete="off">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-2 text-gray-400">
                  Pays
                </Label>
                <CountrySearchablePicker
                  value={country}
                  onChange={setCountry}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-2 text-gray-400">
                  Ville / Gouvernorat
                </Label>
                <Input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex. Tunis, Sfax…"
                  disabled={saving}
                  className="rounded-[20px] py-4 bg-[#F8FAFA] border-none font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-2 text-gray-400">
                  Code postal
                </Label>
                <Input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Ex. 1000"
                  disabled={saving}
                  className="rounded-[20px] py-4 bg-[#F8FAFA] border-none font-bold"
                />
              </div>
            </div>

            {feedback && (
              <p className={`text-sm font-bold ${error ? "text-red-600" : "text-emerald-600"}`}>
                {feedback}
              </p>
            )}

            <div className="flex items-center gap-4 pt-6">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
              >
                Annuler
              </button>
              <Button
                disabled={saving}
                className="flex-[2] py-5 bg-[#00A09D] hover:bg-[#008784] text-white font-[1000] text-[11px] uppercase tracking-[0.2em] rounded-[20px] shadow-lg"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}

function AddressInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
        {label}
      </p>
      <p className="text-sm font-bold text-gray-800 dark:text-white/90">
        {value || "---"}
      </p>
    </div>
  );
}
