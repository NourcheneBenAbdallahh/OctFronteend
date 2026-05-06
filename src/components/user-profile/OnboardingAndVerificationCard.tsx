"use client";

import { useState } from "react";
import { resendVerificationEmail } from "@/lib/auth.api";
import { useAuthStore } from "@/store/useAuthStore";

export default function OnboardingAndVerificationCard() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const isVerified = !!user?.emailVerifiedAt;

  const handleResend = async () => {
    if (!token) return;
    setSending(true);
    setFeedback(null);
    setIsError(false);
    try {
      const message = await resendVerificationEmail(token);
      setFeedback(message || "Email de vérification envoyé.");
    } catch (error: any) {
      setIsError(true);
      setFeedback(error?.message || "Impossible d'envoyer l'email de vérification.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-black text-gray-900">Guidage de démarrage</h3>
      <p className="mt-1 text-sm font-semibold text-gray-500">
        Suivez ces étapes pour utiliser l'application plus facilement.
      </p>

      <ol className="mt-4 space-y-2 text-sm text-gray-700">
        <li>1. Complétez vos informations personnelles dans cette page profil.</li>
        <li>2. Vérifiez votre email (recommandé) pour sécuriser votre compte.</li>
        <li>3. Consultez le tableau de bord puis les modules selon votre rôle.</li>
      </ol>

      <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <p className="text-xs font-black uppercase tracking-widest text-gray-500">
          Vérification Email
        </p>
        <p
          className={`mt-2 text-sm font-semibold ${
            isVerified ? "text-emerald-700" : "text-amber-700"
          }`}
        >
          {isVerified
            ? "Votre email est déjà vérifié."
            : "Votre email n'est pas encore vérifié. Vous pouvez le faire quand vous voulez."}
        </p>

        {!isVerified && (
          <button
            type="button"
            onClick={handleResend}
            disabled={sending || !token}
            className="mt-3 rounded-xl bg-[#1C2434] px-4 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
          >
            {sending ? "Envoi..." : "Renvoyer l'email de vérification"}
          </button>
        )}

        {feedback && (
          <p className={`mt-3 text-xs font-bold ${isError ? "text-red-600" : "text-emerald-600"}`}>
            {feedback}
          </p>
        )}
      </div>
    </section>
  );
}
