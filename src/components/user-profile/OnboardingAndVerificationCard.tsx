"use client";

import { useState } from "react";
import Input from "@/components/form/input/InputField";
import {
  resendVerificationEmail,
  sendPhoneVerificationCode,
  verifyPhone,
} from "@/lib/auth.api";
import { useAuthStore } from "@/store/useAuthStore";

export default function OnboardingAndVerificationCard() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const patchUser = useAuthStore((s) => s.patchUser);

  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);
  const [emailError, setEmailError] = useState(false);

  const [telephone, setTelephone] = useState(user?.telephone ?? "");
  const [code, setCode] = useState("");
  const [sendingPhone, setSendingPhone] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [phoneFeedback, setPhoneFeedback] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const isEmailVerified = !!user?.emailVerifiedAt;
  const isPhoneVerified = !!user?.phoneVerifiedAt;

  const handleResendEmail = async () => {
    if (!token) return;
    setSendingEmail(true);
    setEmailFeedback(null);
    setEmailError(false);
    try {
      const message = await resendVerificationEmail(token);
      setEmailFeedback(message || "Email de vérification envoyé.");
    } catch (error: unknown) {
      setEmailError(true);
      setEmailFeedback(
        error instanceof Error ? error.message : "Impossible d'envoyer l'email de vérification."
      );
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendPhoneCode = async () => {
    if (!token || !telephone.trim()) return;
    setSendingPhone(true);
    setPhoneFeedback(null);
    setPhoneError(false);
    try {
      const message = await sendPhoneVerificationCode(telephone.trim(), token);
      setCodeSent(true);
      setPhoneFeedback(message || "Code envoyé.");
      patchUser({ telephone: telephone.trim(), phoneVerifiedAt: null });
    } catch (error: unknown) {
      setPhoneError(true);
      setPhoneFeedback(
        error instanceof Error ? error.message : "Impossible d'envoyer le code."
      );
    } finally {
      setSendingPhone(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!token || !code.trim()) return;
    setVerifyingPhone(true);
    setPhoneFeedback(null);
    setPhoneError(false);
    try {
      const message = await verifyPhone(code.trim(), token);
      setPhoneFeedback(message || "Téléphone vérifié.");
      patchUser({ phoneVerifiedAt: new Date().toISOString() });
      setCode("");
      setCodeSent(false);
    } catch (error: unknown) {
      setPhoneError(true);
      setPhoneFeedback(error instanceof Error ? error.message : "Code invalide.");
    } finally {
      setVerifyingPhone(false);
    }
  };

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-black text-gray-900">Guidage de démarrage</h3>
      <p className="mt-1 text-sm font-semibold text-gray-500">
        Suivez ces étapes pour utiliser l&apos;application plus facilement.
      </p>

      <ol className="mt-4 space-y-2 text-sm text-gray-700">
        <li>1. Complétez vos informations personnelles dans cette page profil.</li>
        <li>2. Vérifiez votre email (recommandé) pour sécuriser votre compte.</li>
        <li>3. Vérifiez votre numéro (code reçu par email).</li>
        <li>4. Lancez la visite guidée pour découvrir menus, tableaux et actions.</li>
      </ol>

      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("oct-start-app-tour"))}
        className="mt-4 w-full rounded-xl bg-[#00A09D] px-4 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-[#008f8c]"
      >
        Relancer la visite guidée
      </button>

      <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <p className="text-xs font-black uppercase tracking-widest text-gray-500">
          Vérification Email
        </p>
        <p
          className={`mt-2 text-sm font-semibold ${
            isEmailVerified ? "text-emerald-700" : "text-amber-700"
          }`}
        >
          {isEmailVerified
            ? "Votre email est déjà vérifié."
            : "Votre email n'est pas encore vérifié. Vous pouvez le faire quand vous voulez."}
        </p>

        {!isEmailVerified && (
          <button
            type="button"
            onClick={handleResendEmail}
            disabled={sendingEmail || !token}
            className="mt-3 rounded-xl bg-[#1C2434] px-4 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
          >
            {sendingEmail ? "Envoi..." : "Renvoyer l'email de vérification"}
          </button>
        )}

        {emailFeedback && (
          <p className={`mt-3 text-xs font-bold ${emailError ? "text-red-600" : "text-emerald-600"}`}>
            {emailFeedback}
          </p>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <p className="text-xs font-black uppercase tracking-widest text-gray-500">
          Vérification Téléphone
        </p>
        <p
          className={`mt-2 text-sm font-semibold ${
            isPhoneVerified ? "text-emerald-700" : "text-amber-700"
          }`}
        >
          {isPhoneVerified
            ? `Téléphone vérifié : ${user?.telephone ?? ""}`
            : "Saisissez votre numéro : un code à 6 chiffres sera envoyé à votre email."}
        </p>

        {!isPhoneVerified && (
          <div className="mt-4 space-y-3">
            <Input
              type="text"
              defaultValue={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="071234567"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSendPhoneCode}
                disabled={sendingPhone || !token || !telephone.trim()}
                className="rounded-xl bg-[#00A09D] px-4 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
              >
                {sendingPhone ? "Envoi..." : "Envoyer le code"}
              </button>
            </div>

            {codeSent && (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="text"
                  defaultValue={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-40 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold tracking-widest"
                />
                <button
                  type="button"
                  onClick={handleVerifyPhone}
                  disabled={verifyingPhone || !token || !code.trim()}
                  className="rounded-xl bg-[#1C2434] px-4 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
                >
                  {verifyingPhone ? "Vérification..." : "Valider le code"}
                </button>
              </div>
            )}
          </div>
        )}

        {phoneFeedback && (
          <p className={`mt-3 text-xs font-bold ${phoneError ? "text-red-600" : "text-emerald-600"}`}>
            {phoneFeedback}
          </p>
        )}
      </div>
    </section>
  );
}
