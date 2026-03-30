"use client";
import React, { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { EyeCloseIcon, EyeIcon } from "@/icons"; 
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import { login } from "@/lib/auth.api"; 
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore"; // Import du store

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth); // Récupération de l'action de session

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Format d'email invalide";
    if (!password) newErrors.password = "Le mot de passe est requis";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const data = await login({ email, password });
      
  
      setAuth(data.user, data.token);
      
      router.push("/"); 
    } catch (err: any) {
      setErrors({ general: err.message || "Identifiants incorrects" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC]">
      {/* GAUCHE : VISUEL */}
      <div className="hidden lg:flex w-1/2 bg-[#00A09D] relative flex-col justify-between p-20 overflow-hidden group">
        <div className="absolute inset-0 z-0">
          <Image src="/images/stock.png" alt="Stock" fill className="object-cover opacity-30 transition-transform duration-1000 group-hover:scale-110" priority />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#00A09D] via-[#00A09D]/70 to-transparent"></div>
        </div>
        <div className="relative z-20">
          <div className="flex items-center gap-4 mb-14">
            <div className="bg-white p-3 rounded-[22px] shadow-2xl">
              <div className="w-12 h-12 bg-[#00A09D] rounded-[15px] flex items-center justify-center font-[1000] text-3xl italic text-white shadow-inner">S</div>
            </div>
            <div className="flex flex-col text-white">
              <span className="text-3xl font-[1000] tracking-tighter leading-none uppercase">OCT</span>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-200/90">Smart Inventory</span>
            </div>
          </div>
          <h2 className="text-7xl font-[1000] leading-[0.95] text-white tracking-tighter uppercase">La gestion <br /><span className="text-emerald-300 italic text-6xl lowercase">réinventée.</span></h2>
        </div>
        <div className="relative z-20 self-start flex items-center gap-5 bg-white/10 backdrop-blur-xl p-5 rounded-[30px] border border-white/20 transition-transform hover:translate-x-2">
          <div className="w-10 h-10 rounded-full bg-emerald-400 flex items-center justify-center font-black text-[#00A09D] text-lg shadow-lg">✓</div>
          <p className="text-[10px] font-black text-white uppercase tracking-widest leading-tight">Système PFE @2026<br /><span className="text-emerald-100/70">Optimisé Logistique</span></p>
        </div>
      </div>

      {/* DROITE : FORMULAIRE */}
      <div className="flex flex-col justify-center flex-1 px-10 lg:px-28 bg-white py-12">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-12 text-center lg:text-left">
            <h1 className="text-5xl font-[1000] text-[#1C2434] mb-4 tracking-tighter uppercase">Connexion</h1>
            <div className="h-2 w-16 bg-[#00A09D] rounded-full mb-6 mx-auto lg:mx-0"></div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <Label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${errors.email ? 'text-red-500' : 'text-gray-400'}`}>Email</Label>
              <Input 
                onChange={(e) => { setEmail(e.target.value); if(errors.email) setErrors({...errors, email: undefined}); }}
                placeholder="admin@stockmaster.com" 
                className={`w-full py-5 px-7 rounded-[22px] border-2 text-sm font-bold transition-all ${errors.email ? 'border-red-500 bg-red-50/50' : 'border-gray-100 bg-[#F8FAFA] focus:border-[#00A09D]'}`}
              />
              {errors.email && <p className="text-[10px] font-black text-red-500 uppercase ml-4 mt-1">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-2">
                <Label className={`text-[10px] font-black uppercase tracking-widest ${errors.password ? 'text-red-500' : 'text-gray-400'}`}>Mot de passe</Label>
                <Link href="/reset-password" title="Oublié ?" className="text-[10px] text-[#00A09D] font-black uppercase hover:underline">Oublié ?</Link>
              </div>
              <div className="relative">
                <Input
                  onChange={(e) => { setPassword(e.target.value); if(errors.password) setErrors({...errors, password: undefined}); }}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full py-5 px-7 rounded-[22px] border-2 text-sm font-bold transition-all ${errors.password ? 'border-red-500 bg-red-50/50' : 'border-gray-100 bg-[#F8FAFA] focus:border-[#00A09D]'}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-6 top-1/2 -translate-y-1/2 transition-colors ${showPassword ? 'text-[#00A09D]' : 'text-gray-300'}`}>
                  {showPassword ? <EyeIcon size={20} /> : <EyeCloseIcon size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-[10px] font-black text-red-500 uppercase ml-4 mt-1">{errors.password}</p>}
            </div>

            <div className="flex items-center gap-4 py-1 ml-2">
              <Checkbox checked={isChecked} onChange={(val) => setIsChecked(val)} />
              <span className="text-[11px] text-gray-400 font-black uppercase tracking-widest select-none cursor-pointer" onClick={() => setIsChecked(!isChecked)}>Mémoriser ma session</span>
            </div>

            {errors.general && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl font-bold text-[10px] text-red-600 uppercase tracking-widest animate-pulse">
                {errors.general}
              </div>
            )}

            <Button className="w-full py-7 bg-[#00A09D] hover:bg-[#008784] text-white font-[1000] text-[12px] uppercase tracking-[0.3em] rounded-[22px] shadow-[0_15px_30px_rgba(0,160,157,0.3)] transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50" disabled={loading}>
              {loading ? "Vérification..." : "Entrer dans l'entrepôt"}
            </Button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
              Vous n'avez pas de compte ? 
              <Link href="/signup" className="text-[#00A09D] ml-2 border-b-2 border-[#00A09D]/20 hover:border-[#00A09D] transition-all font-black">
                S'inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}