"use client";
import React, { ChangeEvent, DragEvent, useEffect, useState } from "react";
import { UploadCloud } from "lucide-react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import UserPhotoAvatar from "../ui/UserPhotoAvatar";
import { updateProfile } from "@/lib/auth.api";
import { getActionErrorMessage } from "@/hooks/useAppFeedback";
import { useAuthStore } from "@/store/useAuthStore";
import { fileToProfilePhotoDataUrl } from "@/lib/imageToDataUrl";

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { user, token, patchUser } = useAuthStore();

  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("");
  const [saving, setSaving] = useState(false);
  const [importingPhoto, setImportingPhoto] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(user?.name ?? "");
    setPhoto(user?.photo ?? "");
    setFeedback(null);
    setError(false);
  }, [isOpen, user]);

  const handlePhotoImport = async (file: File | null) => {
    if (!file) return;

    setImportingPhoto(true);
    setFeedback(null);
    setError(false);

    try {
      const dataUrl = await fileToProfilePhotoDataUrl(file);
      setPhoto(dataUrl);
    } catch (err) {
      setError(true);
      setFeedback(
        getActionErrorMessage(err, "Impossible d'importer la photo de profil.")
      );
    } finally {
      setImportingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError(true);
      setFeedback("Le nom doit contenir au moins 2 caractères.");
      return;
    }

    setSaving(true);
    setFeedback(null);
    setError(false);

    try {
      const updated = await updateProfile(
        {
          name: trimmedName,
          photo: photo.trim() || null,
        },
        token
      );
      patchUser(updated);
      setFeedback("Profil mis à jour.");
      setTimeout(() => closeModal(), 600);
    } catch (err) {
      setError(true);
      setFeedback(getActionErrorMessage(err, "Impossible de mettre à jour le profil."));
    } finally {
      setSaving(false);
    }
  };

  const previewPhoto = photo || user?.photo;

  return (
    <>
      <div className="p-6 bg-white border-2 border-gray-100 rounded-[30px] shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="relative">
              <div className="w-24 h-24 p-1 overflow-hidden border-2 border-[#00A09D] rounded-full">
                <UserPhotoAvatar
                  photo={user?.photo}
                  name={user?.name}
                  size={96}
                  className="w-full h-full rounded-full"
                />
              </div>
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full dark:border-gray-900"></div>
            </div>

            <div className="order-3 xl:order-2">
              <h4 className="mb-1 text-2xl font-[1000] uppercase tracking-tighter text-center text-[#1C2434] dark:text-white xl:text-left">
                {user?.name || "Chargement..."}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#00A09D]">
                  {user?.role || "Administrateur"}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openModal}
            className="bg-white text-[#1C2434] border-2 border-[#1C2434] px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#1C2434] hover:text-white transition-all shadow-[6px_6px_0px_rgba(0,160,157,0.3)] active:translate-y-1 active:shadow-none"
          >
            Modifier le Profil
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px]">
        <div className="relative w-full p-8 bg-white rounded-[35px] dark:bg-[#1C2434] max-h-[90vh] overflow-y-auto no-scrollbar">
          <div className="mb-10 text-center xl:text-left">
            <h4 className="text-3xl font-[1000] uppercase tracking-tighter text-[#1C2434] dark:text-white mb-2">
              Paramètres du Compte
            </h4>
            <div className="h-1.5 w-16 bg-[#00A09D] rounded-full mx-auto xl:mx-0"></div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="p-6 border-2 border-dashed border-gray-100 rounded-[25px] flex flex-col items-center gap-4 bg-[#F8FAFA] dark:bg-white/5">
              <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden">
                <UserPhotoAvatar
                  photo={previewPhoto}
                  name={user?.name}
                  size={80}
                  className="w-full h-full"
                />
              </div>

              <div
                onDragOver={(e: DragEvent) => e.preventDefault()}
                onDrop={(e: DragEvent) => {
                  e.preventDefault();
                  void handlePhotoImport(e.dataTransfer.files[0] ?? null);
                }}
                className="relative group w-full border-2 border-dashed border-gray-200 rounded-[20px] p-4 flex flex-col items-center justify-center bg-white hover:border-[#00A09D]/40 transition-all cursor-pointer min-h-[100px] dark:bg-white/5 dark:border-gray-700"
              >
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={importingPhoto || saving}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    void handlePhotoImport(e.target.files?.[0] ?? null)
                  }
                />
                {importingPhoto ? (
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#00A09D]">
                    Import en cours…
                  </span>
                ) : previewPhoto ? (
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#00A09D]">
                    Changer la photo
                  </span>
                ) : (
                  <>
                    <UploadCloud className="text-gray-300 group-hover:text-[#00A09D] transition-colors mb-2" size={28} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Glisser une image ou cliquer pour importer
                    </span>
                  </>
                )}
              </div>

              {photo && (
                <button
                  type="button"
                  onClick={() => setPhoto("")}
                  disabled={saving || importingPhoto}
                  className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 disabled:opacity-50"
                >
                  Supprimer la photo
                </button>
              )}

              <div className="w-full space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-2 text-gray-400">
                  Ou URL de la photo
                </Label>
                <Input
                  type="text"
                  value={photo.startsWith("data:image") ? "" : photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  placeholder="https://…"
                  disabled={importingPhoto || saving}
                  className="rounded-[20px] py-4 bg-white border-none font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-2 text-gray-400">Nom Complet</Label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-[20px] py-4 bg-[#F8FAFA] border-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-2 text-gray-400">Rôle</Label>
                <Input
                  type="text"
                  value={user?.role ?? ""}
                  disabled
                  className="rounded-[20px] py-4 bg-[#F8FAFA] border-none font-bold opacity-60"
                />
              </div>
            </div>

            {feedback && (
              <p className={`text-sm font-bold ${error ? "text-red-600" : "text-emerald-600"}`}>
                {feedback}
              </p>
            )}

            <div className="flex items-center gap-4 pt-4">
              <Button
                type="button"
                onClick={closeModal}
                disabled={saving}
                variant="outline"
                className="flex-1 rounded-[20px] py-4 text-[10px] font-black uppercase tracking-widest border-2"
              >
                Fermer
              </Button>
              <Button
                disabled={saving || importingPhoto}
                className="flex-[2] py-5 bg-[#00A09D] text-white font-[1000] text-[11px] uppercase tracking-[0.2em] rounded-[22px] shadow-xl"
              >
                {saving ? "Enregistrement…" : "Sauvegarder"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
