"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyEmail } from "@/lib/auth.api";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Vérification de votre email...");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const runVerification = async () => {
      if (!token) {
        setMessage("Lien de vérification invalide : token manquant.");
        setIsError(true);
        setLoading(false);
        return;
      }

      try {
        const result = await verifyEmail(token);
        setMessage(result || "Email vérifié avec succès.");
        setIsError(false);
      } catch (error: any) {
        setMessage(error?.message || "Lien invalide ou expiré.");
        setIsError(true);
      } finally {
        setLoading(false);
      }
    };

    runVerification();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-xl p-10 border border-gray-100">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Vérification de l’email
          </h1>
          <div className="h-1.5 w-12 bg-[#00A09D] rounded-full mt-3"></div>
        </div>

        <div
          className={`rounded-2xl p-5 text-sm font-semibold ${
            isError
              ? "bg-red-50 text-red-600 border border-red-100"
              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
          }`}
        >
          {loading ? "Vérification en cours..." : message}
        </div>

        <div className="mt-8 flex gap-4">
          <Link
            href="/signin"
            className="inline-flex items-center justify-center rounded-2xl bg-[#00A09D] px-6 py-3 text-white font-black uppercase tracking-wider hover:bg-[#008784] transition-colors"
          >
            Aller au login
          </Link>

          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-6 py-3 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
          >
            Retour à l’inscription
          </Link>
        </div>
      </div>
    </div>
  );
}