"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { forgotPassword } from "@/lib/auth.api";
import { isValidEmailFormat } from "@/lib/email-validation";
import AuthBrandAside from "@/components/auth/AuthBrandAside";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; general?: string }>({});
  const [success, setSuccess] = useState<string | null>(null);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = "L'email est requis";
    else if (!isValidEmailFormat(email)) newErrors.email = "Format d'email invalide";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    setSuccess(null);

    try {
      const message = await forgotPassword(email);
      setSuccess(message || "Un lien de réinitialisation a été envoyé à votre adresse email.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Impossible d'envoyer le lien.";
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC]">
      <AuthBrandAside
        tagline={
          <>
            Mot de passe <br />
            <span className="text-emerald-300 italic text-6xl lowercase">oublié ?</span>
          </>
        }
        footerTitle="Réinitialisation sécurisée"
        footerSubtitle="Lien par email"
      />

      <div className="flex flex-col justify-center flex-1 px-10 lg:px-28 bg-white py-12">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-12 text-center lg:text-left">
            <h1 className="text-5xl font-[1000] text-[#1C2434] mb-4 tracking-tighter uppercase">
              Réinitialiser
            </h1>
            <div className="h-2 w-16 bg-[#00A09D] rounded-full mb-6 mx-auto lg:mx-0" />
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Saisissez votre email pour recevoir un lien de réinitialisation.
            </p>
          </div>

          {success ? (
            <div className="space-y-6">
              <div className="rounded-xl border-l-4 border-emerald-500 bg-emerald-50 p-4 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                {success}
              </div>
              <Link
                href="/signin"
                className="inline-flex w-full items-center justify-center py-7 bg-[#00A09D] hover:bg-[#008784] text-white font-[1000] text-[12px] uppercase tracking-[0.3em] rounded-[22px] shadow-[0_15px_30px_rgba(0,160,157,0.3)] transition-all hover:-translate-y-1"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2">
                <Label
                  className={`text-[10px] font-black uppercase tracking-widest ml-2 ${
                    errors.email ? "text-red-500" : "text-gray-400"
                  }`}
                >
                  Email
                </Label>
                <Input
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  placeholder="admin@stockmaster.com"
                  className={`w-full py-5 px-7 rounded-[22px] border-2 text-sm font-bold transition-all ${
                    errors.email
                      ? "border-red-500 bg-red-50/50"
                      : "border-gray-100 bg-[#F8FAFA] focus:border-[#00A09D]"
                  }`}
                />
                {errors.email && (
                  <p className="text-[10px] font-black text-red-500 uppercase ml-4 mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              {errors.general && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl font-bold text-[10px] text-red-600 uppercase tracking-widest">
                  {errors.general}
                </div>
              )}

              <Button
                className="w-full py-7 bg-[#00A09D] hover:bg-[#008784] text-white font-[1000] text-[12px] uppercase tracking-[0.3em] rounded-[22px] shadow-[0_15px_30px_rgba(0,160,157,0.3)] transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Envoi..." : "Envoyer le lien"}
              </Button>
            </form>
          )}

          <div className="mt-10 text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
              Vous vous souvenez ?
              <Link
                href="/signin"
                className="text-[#00A09D] ml-2 border-b-2 border-[#00A09D]/20 hover:border-[#00A09D] transition-all font-black"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
