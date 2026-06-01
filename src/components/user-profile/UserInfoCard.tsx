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

function splitName(fullName?: string | null) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const {
    isOpen: isPasswordModalOpen,
    openModal: openPasswordModal,
    closeModal: closePasswordModal,
  } = useModal();
  const { user, token, patchUser } = useAuthStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [passwordPrompt, setPasswordPrompt] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const display = splitName(user?.name);
  const emailChanged =
    email.trim().toLowerCase() !== (user?.email ?? "").trim().toLowerCase();
  const telephoneChanged =
    telephone.trim() !== (user?.telephone ?? "").trim();

  useEffect(() => {
    if (!isOpen) return;
    const { firstName: fn, lastName: ln } = splitName(user?.name);
    setFirstName(fn);
    setLastName(ln);
    setEmail(user?.email ?? "");
    setTelephone(user?.telephone ?? "");
    setFeedback(null);
    setError(false);
    setPasswordPrompt("");
    setPasswordError(null);
  }, [isOpen, user]);

  const buildPayload = () => {
    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
    const trimmedPhone = telephone.trim();
    return { name, trimmedPhone };
  };

  const validateBaseForm = () => {
    const { name, trimmedPhone } = buildPayload();
    if (name.length < 2) {
      setError(true);
      setFeedback("Le nom complet doit contenir au moins 2 caractères.");
      return false;
    }
    if (!email.trim()) {
      setError(true);
      setFeedback("L'adresse email est obligatoire.");
      return false;
    }
    if (trimmedPhone && !/^[0-9+ ]{8,}$/.test(trimmedPhone)) {
      setError(true);
      setFeedback("Numéro de téléphone invalide.");
      return false;
    }
    return true;
  };

  const submitProfile = async (passwordForEmail?: string) => {
    if (!token) return;
    const { name, trimmedPhone } = buildPayload();

    setSaving(true);
    setFeedback(null);
    setError(false);

    try {
      const payload: {
        name: string;
        email?: string;
        current_password?: string;
        telephone?: string | null;
      } = { name };
      if (emailChanged) {
        payload.email = email.trim();
        payload.current_password = passwordForEmail;
      }
      if (telephoneChanged) {
        payload.telephone = trimmedPhone || null;
      }

      const updated = await updateProfile(payload, token);
      patchUser(updated);
      const messages: string[] = ["Profil mis à jour."];
      if (emailChanged) {
        messages.push("Un email de vérification sera envoyé si l'adresse a changé.");
      }
      if (telephoneChanged && trimmedPhone) {
        messages.push("Le numéro devra être revérifié.");
      }
      setFeedback(messages.join(" "));
      setPasswordPrompt("");
      setPasswordError(null);
      closePasswordModal();
      setTimeout(() => closeModal(), 600);
    } catch (err) {
      if (emailChanged) {
        setPasswordError(
          getActionErrorMessage(err, "Mot de passe incorrect. L'email reste inchangé.")
        );
      } else {
        setError(true);
        setFeedback(getActionErrorMessage(err, "Impossible de mettre à jour le profil."));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBaseForm()) return;

    if (emailChanged) {
      setPasswordPrompt("");
      setPasswordError(null);
      openPasswordModal();
      return;
    }

    await submitProfile();
  };

  const handlePasswordConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordPrompt.trim()) {
      setPasswordError("Le mot de passe actuel est requis.");
      return;
    }
    setPasswordError(null);
    await submitProfile(passwordPrompt);
  };

  const handlePasswordCancel = () => {
    setEmail(user?.email ?? "");
    setPasswordPrompt("");
    setPasswordError(null);
    closePasswordModal();
  };

  return (
    <div className="p-6 bg-white border-2 border-gray-100 rounded-[30px] shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-8 bg-[#00A09D] rounded-full"></div>
            <h4 className="text-xl font-[1000] uppercase tracking-tighter text-[#1C2434] dark:text-white">
              Informations Personnelles
            </h4>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-8 md:grid-cols-2 lg:gap-y-10">
            <InfoDisplay label="Prénom" value={display.firstName} />
            <InfoDisplay label="Nom" value={display.lastName} />
            <InfoDisplay label="Adresse Email" value={user?.email || "Non renseigné"} />
            <InfoDisplay
              label="Téléphone"
              value={
                user?.telephone
                  ? `${user.telephone}${user?.phoneVerifiedAt ? " (vérifié)" : " (non vérifié)"}`
                  : "Non renseigné"
              }
            />
            <div className="md:col-span-2">
              <InfoDisplay label="Rôle" value={user?.role || "Utilisateur"} />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="flex items-center justify-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[#00A09D] transition-all bg-emerald-50 rounded-full hover:bg-[#00A09D] hover:text-white group"
        >
          Éditer
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[750px]">
        <div className="relative w-full p-8 bg-white rounded-[35px] dark:bg-[#1C2434] max-h-[90vh] overflow-y-auto no-scrollbar">
          <div className="mb-10">
            <h4 className="text-3xl font-[1000] uppercase tracking-tighter text-[#1C2434] dark:text-white mb-2">
              Modifier Profil
            </h4>
            <div className="h-1.5 w-12 bg-[#00A09D] rounded-full"></div>
          </div>

          <form onSubmit={handleSave} className="space-y-8" name="oct-profile-identity">
            <div className="space-y-5">
              <h5 className="text-[11px] font-[1000] uppercase tracking-[0.2em] text-[#00A09D]">
                Identité
              </h5>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-2 text-gray-400">
                    Prénom
                  </Label>
                  <Input
                    type="text"
                    name="oct-first-name"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="rounded-[20px] bg-[#F8FAFA] border-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-2 text-gray-400">
                    Nom
                  </Label>
                  <Input
                    type="text"
                    name="oct-last-name"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-[20px] bg-[#F8FAFA] border-none font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 overflow-visible rounded-[20px] border border-gray-100 bg-[#F8FAFA] p-5 dark:border-gray-700 dark:bg-white/5">
              <h5 className="text-[11px] font-[1000] uppercase tracking-[0.2em] text-[#00A09D]">
                Email
              </h5>
              <div className="space-y-2">
                <Label
                  htmlFor="oct-profile-email"
                  className="text-[10px] font-black uppercase tracking-widest ml-2 text-gray-400"
                >
                  Adresse email
                </Label>
                <Input
                  id="oct-profile-email"
                  type="email"
                  name="oct-profile-email"
                  autoComplete="username email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-[20px] bg-white border-none font-bold"
                />
              </div>
              {emailChanged ? (
                <p className="text-xs font-semibold text-[#00A09D]">
                  Une nouvelle fenêtre demandera votre mot de passe pour confirmer le changement
                  d&apos;email.
                </p>
              ) : (
                <p className="text-xs font-semibold text-gray-500">
                  Modifier l&apos;email nécessitera votre mot de passe actuel.
                </p>
              )}
            </div>

            <div className="space-y-3 rounded-[20px] border border-gray-100 bg-[#F8FAFA] p-5 dark:border-gray-700 dark:bg-white/5">
              <h5 className="text-[11px] font-[1000] uppercase tracking-[0.2em] text-[#00A09D]">
                Téléphone
              </h5>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-2 text-gray-400">
                  Numéro de téléphone
                </Label>
                <Input
                  type="tel"
                  name="oct-profile-telephone"
                  autoComplete="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="+216 00 000 000"
                  className="rounded-[20px] bg-white border-none font-bold"
                />
              </div>
              <p className="text-xs font-semibold text-gray-500">
                Laisser vide pour supprimer le numéro. Un changement nécessite une
                nouvelle vérification.
              </p>
            </div>

            {feedback && (
              <p className={`text-sm font-bold ${error ? "text-red-600" : "text-emerald-600"}`}>
                {feedback}
              </p>
            )}

            <div className="flex items-center gap-4 pt-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400"
              >
                Annuler
              </button>
              <Button
                disabled={saving}
                className="flex-[2] py-5 bg-[#00A09D] text-white font-[1000] text-[11px] uppercase tracking-[0.2em] rounded-[22px] shadow-lg"
              >
                {saving ? "Enregistrement…" : "Mettre à jour"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={handlePasswordCancel}
        className="max-w-[520px]"
      >
        <div className="relative w-full rounded-[30px] bg-white p-8 dark:bg-[#1C2434]">
          <h4 className="mb-2 text-2xl font-[1000] uppercase tracking-tight text-[#1C2434] dark:text-white">
            Confirmer l&apos;email
          </h4>
          <p className="mb-6 text-sm font-semibold text-gray-500">
            Saisissez votre mot de passe actuel pour modifier l&apos;adresse email.
          </p>

          <form onSubmit={handlePasswordConfirm} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="oct-profile-password-prompt"
                className="ml-2 text-[10px] font-black uppercase tracking-widest text-gray-400"
              >
                Mot de passe actuel
              </Label>
              <Input
                id="oct-profile-password-prompt"
                type="password"
                name="oct-profile-password-prompt"
                autoComplete="current-password"
                value={passwordPrompt}
                onChange={(e) => setPasswordPrompt(e.target.value)}
                className="rounded-[20px] bg-[#F8FAFA] border-none font-bold"
              />
            </div>

            {passwordError && <p className="text-sm font-bold text-red-600">{passwordError}</p>}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePasswordCancel}
                disabled={saving}
                className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400"
              >
                Annuler
              </button>
              <Button
                disabled={saving}
                className="flex-[1.5] rounded-[20px] bg-[#00A09D] py-4 text-[10px] font-black uppercase tracking-widest text-white"
              >
                {saving ? "Vérification..." : "Confirmer"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

function InfoDisplay({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
        {label}
      </p>
      <p className="text-sm font-bold break-words text-gray-800 dark:text-white/90">
        {value || "---"}
      </p>
    </div>
  );
}
