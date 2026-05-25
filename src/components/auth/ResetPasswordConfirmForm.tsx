"use client";

import React, { useState, FormEvent, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { resetPassword, resetPasswordByPhone } from "@/lib/auth.api";
import AuthBrandAside from "@/components/auth/AuthBrandAside";

export default function ResetPasswordConfirmForm() {
  const searchParams = useSearchParams();
  const channel = searchParams.get("channel") === "phone" ? "phone" : "email";
  const emailFromUrl = searchParams.get("email") ?? "";
  const tokenFromUrl = searchParams.get("token") ?? "";
  const telephoneFromUrl = searchParams.get("telephone") ?? "";

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    code?: string;
    password?: string;
    password_confirmation?: string;
    general?: string;
  }>({});
  const [success, setSuccess] = useState(false);

  const linkInvalid = useMemo(() => {
    if (channel === "phone") {
      return !telephoneFromUrl.trim();
    }
    return !emailFromUrl.trim() || !tokenFromUrl.trim();
  }, [channel, emailFromUrl, tokenFromUrl, telephoneFromUrl]);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (channel === "phone" && !code.trim()) {
      newErrors.code = "Code requis";
    }
    if (password.length < 8) newErrors.password = "Min. 8 caractères";
    if (password !== passwordConfirmation) {
      newErrors.password_confirmation = "Les mots de passe ne correspondent pas";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (linkInvalid || !validate()) return;
    setLoading(true);
    setErrors({});

    try {
      if (channel === "phone") {
        await resetPasswordByPhone({
          telephone: telephoneFromUrl,
          code: code.trim(),
          password,
          password_confirmation: passwordConfirmation,
        });
      } else {
        await resetPassword({
          email: emailFromUrl,
          token: tokenFromUrl,
          password,
          password_confirmation: passwordConfirmation,
        });
      }
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Réinitialisation impossible.";
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
            Nouveau <br />
            <span className="text-emerald-300 italic text-6xl lowercase">mot de passe.</span>
          </>
        }
        footerTitle="Accès sécurisé"
        footerSubtitle={channel === "phone" ? "Code par email" : "Lien email"}
      />

      <div className="flex flex-col justify-center flex-1 px-10 lg:px-28 bg-white py-12">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-12 text-center lg:text-left">
            <h1 className="text-5xl font-[1000] text-[#1C2434] mb-4 tracking-tighter uppercase">
              Nouveau mot de passe
            </h1>
            <div className="h-2 w-16 bg-[#00A09D] rounded-full mb-6 mx-auto lg:mx-0" />
          </div>

          {linkInvalid ? (
            <div className="space-y-6">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl font-bold text-[10px] text-red-600 uppercase tracking-widest">
                {channel === "phone"
                  ? "Numéro de téléphone manquant. Reprenez depuis mot de passe oublié."
                  : "Lien de réinitialisation invalide ou incomplet."}
              </div>
              <Link
                href="/reset-password"
                className="inline-flex w-full items-center justify-center py-7 bg-[#00A09D] hover:bg-[#008784] text-white font-[1000] text-[12px] uppercase tracking-[0.3em] rounded-[22px] transition-all"
              >
                Retour
              </Link>
            </div>
          ) : success ? (
            <div className="space-y-6">
              <div className="rounded-xl border-l-4 border-emerald-500 bg-emerald-50 p-4 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                Votre mot de passe a été réinitialisé avec succès.
              </div>
              <Link
                href="/signin"
                className="inline-flex w-full items-center justify-center py-7 bg-[#00A09D] hover:bg-[#008784] text-white font-[1000] text-[12px] uppercase tracking-[0.3em] rounded-[22px] shadow-[0_15px_30px_rgba(0,160,157,0.3)] transition-all hover:-translate-y-1"
              >
                Se connecter
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              {channel === "phone" ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-2 text-gray-400">
                      Téléphone
                    </Label>
                    <Input
                      defaultValue={telephoneFromUrl}
                      disabled
                      className="w-full py-5 px-7 rounded-[22px] border-2 border-gray-100 bg-gray-50 text-sm font-bold text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      className={`text-[10px] font-black uppercase tracking-widest ml-2 ${
                        errors.code ? "text-red-500" : "text-gray-400"
                      }`}
                    >
                      Code reçu par email
                    </Label>
                    <Input
                      onChange={(e) => {
                        setCode(e.target.value);
                        if (errors.code) setErrors({ ...errors, code: undefined });
                      }}
                      placeholder="123456"
                      className={`w-full py-5 px-7 rounded-[22px] border-2 text-sm font-bold tracking-widest transition-all ${
                        errors.code
                          ? "border-red-500 bg-red-50/50"
                          : "border-gray-100 bg-[#F8FAFA] focus:border-[#00A09D]"
                      }`}
                    />
                    {errors.code && (
                      <p className="text-[10px] font-black text-red-500 uppercase ml-4 mt-1">
                        {errors.code}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-2 text-gray-400">
                    Email
                  </Label>
                  <Input
                    defaultValue={emailFromUrl}
                    disabled
                    className="w-full py-5 px-7 rounded-[22px] border-2 border-gray-100 bg-gray-50 text-sm font-bold text-gray-500"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label
                  className={`text-[10px] font-black uppercase tracking-widest ml-2 ${
                    errors.password ? "text-red-500" : "text-gray-400"
                  }`}
                >
                  Nouveau mot de passe
                </Label>
                <div className="relative">
                  <Input
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`w-full py-5 px-7 rounded-[22px] border-2 text-sm font-bold transition-all ${
                      errors.password
                        ? "border-red-500 bg-red-50/50"
                        : "border-gray-100 bg-[#F8FAFA] focus:border-[#00A09D]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-6 top-1/2 -translate-y-1/2 transition-colors ${
                      showPassword ? "text-[#00A09D]" : "text-gray-300"
                    }`}
                  >
                    {showPassword ? <EyeIcon size={20} /> : <EyeCloseIcon size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[10px] font-black text-red-500 uppercase ml-4 mt-1">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  className={`text-[10px] font-black uppercase tracking-widest ml-2 ${
                    errors.password_confirmation ? "text-red-500" : "text-gray-400"
                  }`}
                >
                  Confirmer le mot de passe
                </Label>
                <div className="relative">
                  <Input
                    onChange={(e) => {
                      setPasswordConfirmation(e.target.value);
                      if (errors.password_confirmation) {
                        setErrors({ ...errors, password_confirmation: undefined });
                      }
                    }}
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    className={`w-full py-5 px-7 rounded-[22px] border-2 text-sm font-bold transition-all ${
                      errors.password_confirmation
                        ? "border-red-500 bg-red-50/50"
                        : "border-gray-100 bg-[#F8FAFA] focus:border-[#00A09D]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className={`absolute right-6 top-1/2 -translate-y-1/2 transition-colors ${
                      showConfirm ? "text-[#00A09D]" : "text-gray-300"
                    }`}
                  >
                    {showConfirm ? <EyeIcon size={20} /> : <EyeCloseIcon size={20} />}
                  </button>
                </div>
                {errors.password_confirmation && (
                  <p className="text-[10px] font-black text-red-500 uppercase ml-4 mt-1">
                    {errors.password_confirmation}
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
                {loading ? "Enregistrement..." : "Enregistrer le mot de passe"}
              </Button>
            </form>
          )}

          <div className="mt-10 text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
              <Link
                href="/signin"
                className="text-[#00A09D] border-b-2 border-[#00A09D]/20 hover:border-[#00A09D] transition-all font-black"
              >
                Retour à la connexion
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
