"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons"; 
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import { register } from "@/lib/auth.api"; 
import { useRouter } from "next/navigation";

export default function SignUpForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fullName = `${firstName} ${lastName}`;
      const data = await register({ name: fullName, email, password });
      // Sauvegarde token si nécessaire
      localStorage.setItem("token", data.token);
      // Redirection vers dashboard ou autre
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white flex-col-reverse lg:flex-row">
      
      <div className="flex flex-col justify-center flex-1 px-10 sm:px-16 lg:px-28 bg-white overflow-y-auto py-12">
        <div className="w-full max-w-md mx-auto">
          
          <Link
            href="/"
            className="group inline-flex items-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-[#00A09D] transition-all mb-12"
          >
            <div className="p-2 rounded-full border border-gray-100 mr-3 group-hover:border-[#00A09D]/30 transition-colors">
              <ChevronLeftIcon className="transform group-hover:-translate-x-1 transition-transform" />
            </div>
            Retour au Dashboard
          </Link>

          <div className="mb-10">
            <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tighter">Créer un compte</h1>
            <div className="h-1.5 w-12 bg-[#00A09D] rounded-full mb-4"></div>
            <p className="text-gray-400 font-medium">Remplissez les informations pour accéder au système.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Prénom</Label>
                <Input 
                  defaultValue={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jean" 
                  className="w-full border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#00A09D] focus:ring-[6px] focus:ring-[#00A09D]/5 transition-all py-4 px-6 rounded-2xl border-2 text-sm font-semibold shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom</Label>
                <Input 
                  defaultValue={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Dupont" 
                  className="w-full border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#00A09D] focus:ring-[6px] focus:ring-[#00A09D]/5 transition-all py-4 px-6 rounded-2xl border-2 text-sm font-semibold shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Professionnel / Matricule</Label>
              <Input 
                defaultValue={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email" 
                placeholder="gestionnaire.pfe@stockmaster.com" 
                className="w-full border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#00A09D] focus:ring-[6px] focus:ring-[#00A09D]/5 transition-all py-4 px-6 rounded-2xl border-2 text-sm font-semibold shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Mot de passe</Label>
              <div className="relative group">
                <Input
                  defaultValue={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  className="w-full border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#00A09D] focus:ring-[6px] focus:ring-[#00A09D]/5 transition-all py-4 px-6 rounded-2xl border-2 text-sm font-semibold shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#00A09D] transition-colors"
                >
                  {showPassword ? <EyeIcon size={20} /> : <EyeCloseIcon size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-4 py-2">
              <div className="pt-1">
                <Checkbox checked={isChecked} onChange={setIsChecked} />
              </div>
              <p className="text-[11px] text-gray-500 font-bold leading-relaxed select-none">
                J'accepte les <span className="text-[#00A09D] cursor-pointer hover:underline font-extrabold tracking-tighter">Conditions d'Utilisation</span> et la <span className="text-[#00A09D] cursor-pointer hover:underline font-extrabold tracking-tighter">Politique de Confidentialité</span> de StockMaster.
              </p>
            </div>

            {error && <p className="text-red-500 font-bold text-sm">{error}</p>}

            <Button 
              className="w-full py-7 bg-[#00A09D] hover:bg-[#008784] text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl shadow-[0_20px_40px_rgba(0,160,157,0.25)] transition-all transform hover:-translate-y-1.5 active:scale-[0.97]"
              disabled={loading}
            >
              {loading ? "Création en cours..." : "Créer mon accès gestionnaire"}
            </Button>
          </form>

          <div className="mt-12 text-center pt-8 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Déjà un compte ? {" "}
              <Link href="/signin" className="text-[#00A09D] hover:text-[#008784] transition-colors ml-1 font-black uppercase tracking-tighter border-b-2 border-[#00A09D]/20">
                Se connecter
              </Link>
            </p>
          </div>
          
        </div>
      </div>

      {/* template droit inchangé */}
      <div className="hidden lg:flex w-1/2 bg-[#00A09D] relative flex-col justify-between p-20 overflow-hidden group">
        <div className="absolute inset-0 z-0 transition-transform duration-1000 group-hover:scale-110">
          <Image 
            src="/images/stock.png" 
            alt="Logistique Entrepôt"
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-bl from-[#00A09D] via-[#00A09D]/60 to-transparent"></div>
        </div>

        <div className="relative z-20">
          <div className="flex items-center gap-4 mb-14">
            <div className="bg-white p-3 rounded-2xl shadow-2xl transform rotate-3 transition-transform group-hover:rotate-0">
              <div className="w-12 h-12 bg-[#00A09D] rounded-xl flex items-center justify-center font-black text-3xl italic text-white shadow-inner">S</div>
            </div>
            <div className="flex flex-col text-white">
              <span className="text-3xl font-black tracking-tighter leading-none">OCT</span>
              <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-emerald-200/80">Gestion Intégrée </span>
            </div>
          </div>

          <h2 className="text-6xl font-black leading-[1.05] text-white tracking-tighter mb-6">
            L'excellence <br /> 
            <span className="text-emerald-300 italic">à chaque flux.</span>
          </h2>
          <p className="text-emerald-50/80 text-xl max-w-sm leading-relaxed font-light">
            Gérez vos emballages de produits alimentaires avec une traçabilité totale et sécurisée.
          </p>
        </div>

        <div className="relative z-20 self-start flex items-center gap-5 bg-white/10 backdrop-blur-xl p-5 rounded-[2rem] border border-white/20 shadow-2xl transition-transform hover:translate-x-2">
          <div className="w-12 h-12 rounded-full bg-emerald-400 flex items-center justify-center font-black text-[#00A09D] text-xl shadow-[0_0_20px_rgba(52,211,153,0.4)]">✓</div>
          <div className="flex flex-col">
            <p className="text-sm font-black text-white uppercase tracking-wider">Inscrivez-vous</p>
            <p className="text-xs text-emerald-100/70">@2026 — Certifié Logistique</p>
          </div>
        </div>
      </div>
    </div>
  );
}