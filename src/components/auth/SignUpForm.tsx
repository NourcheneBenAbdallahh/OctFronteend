"use client";
import React, { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { EyeCloseIcon, EyeIcon } from "@/icons"; 
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import { register } from "@/lib/auth.api";
import { isValidEmailFormat } from "@/lib/email-validation"; 
import { useRouter } from "next/navigation";

export default function SignUpForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const router = useRouter();

  const validate = () => {
    const e: any = {};
    if (!firstName.trim()) e.firstName = "Prénom requis";
    if (!lastName.trim()) e.lastName = "Nom requis";
    if (!isValidEmailFormat(email)) e.email = "Email invalide";
    if (password.length < 8) e.password = "Min. 8 caractères";
    if (!isChecked) e.terms = "Acceptation requise";
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleInputChange = (field: string, value: string | boolean, setter: Function) => {
    setter(value);
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const fullName = `${firstName} ${lastName}`;
      await register({ name: fullName, email, password });

      // Nouveau flux: inscription => compte inactif, attente activation admin.
      router.push("/signin?pendingActivation=1");
    } catch (err: any) {
      setErrors({ general: err.message || "Erreur lors de l'inscription" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#F8FAFC] flex-col-reverse lg:flex-row">
      
      {/* SECTION FORMULAIRE */}
      <div className="flex flex-col justify-center flex-1 px-10 lg:px-28 bg-white py-12">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-5xl font-[1000] text-[#1C2434] mb-4 tracking-tighter uppercase">Inscription</h1>
            <div className="h-2 w-16 bg-[#00A09D] rounded-full mb-6 mx-auto lg:mx-0"></div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            
            {/* PRÉNOM & NOM */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${errors.firstName ? 'text-red-500' : 'text-gray-400'}`}>Prénom</Label>
                <Input 
                  onChange={(e) => handleInputChange('firstName', e.target.value, setFirstName)} 
                  className={`w-full py-4 px-6 rounded-[22px] border-2 font-bold transition-all ${errors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-[#F8FAFA] focus:border-[#00A09D]'}`} 
                  placeholder="Jean" 
                />
                {errors.firstName && <p className="text-[9px] font-black text-red-500 uppercase ml-4">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${errors.lastName ? 'text-red-500' : 'text-gray-400'}`}>Nom</Label>
                <Input 
                  onChange={(e) => handleInputChange('lastName', e.target.value, setLastName)} 
                  className={`w-full py-4 px-6 rounded-[22px] border-2 font-bold transition-all ${errors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-[#F8FAFA] focus:border-[#00A09D]'}`} 
                  placeholder="Dupont" 
                />
                {errors.lastName && <p className="text-[9px] font-black text-red-500 uppercase ml-4">{errors.lastName}</p>}
              </div>
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <Label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${errors.email ? 'text-red-500' : 'text-gray-400'}`}>Email Professionnel</Label>
              <Input 
                onChange={(e) => handleInputChange('email', e.target.value, setEmail)} 
                type="email" 
                className={`w-full py-4 px-6 rounded-[22px] border-2 font-bold transition-all ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-[#F8FAFA] focus:border-[#00A09D]'}`} 
                placeholder="votre@email.com" 
              />
              {errors.email && <p className="text-[9px] font-black text-red-500 uppercase ml-4">{errors.email}</p>}
            </div>

            {/* MOT DE PASSE */}
            <div className="space-y-2">
              <Label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${errors.password ? 'text-red-500' : 'text-gray-400'}`}>Mot de passe</Label>
              <div className="relative">
                <Input 
                  onChange={(e) => handleInputChange('password', e.target.value, setPassword)} 
                  type={showPassword ? "text" : "password"} 
                  className={`w-full py-4 px-6 rounded-[22px] border-2 font-bold transition-all ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-[#F8FAFA] focus:border-[#00A09D]'}`} 
                  placeholder="••••••••" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className={`absolute right-6 top-1/2 -translate-y-1/2 transition-colors ${showPassword ? 'text-[#00A09D]' : 'text-gray-300'}`}
                >
                  {showPassword ? <EyeIcon size={20} /> : <EyeCloseIcon size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-[9px] font-black text-red-500 uppercase ml-4">{errors.password}</p>}
            </div>

            {/* CONDITIONS COCHÉES */}
            <div className="space-y-1">
              <div className="flex items-start gap-4 py-2 ml-2">
                <Checkbox 
                  checked={isChecked} 
                  onChange={(val) => handleInputChange('terms', val, setIsChecked)} 
                />
                <p className={`text-[10px] font-[1000] uppercase leading-relaxed select-none cursor-pointer ${errors.terms ? 'text-red-500' : 'text-gray-400'}`} onClick={() => handleInputChange('terms', !isChecked, setIsChecked)}>
                  J&apos;accepte les conditions de StockMaster.
                </p>
              </div>
              {errors.terms && <p className="text-[9px] font-black text-red-500 uppercase ml-4">{errors.terms}</p>}
            </div>

            {/* ERREUR GÉNÉRALE API */}
            {errors.general && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl">
                <p className="text-red-600 font-black text-[10px] uppercase tracking-widest">{errors.general}</p>
              </div>
            )}

            <Button 
              className="w-full py-7 bg-[#00A09D] text-white font-[1000] text-[12px] uppercase tracking-[0.3em] rounded-[22px] shadow-[0_15px_30px_rgba(0,160,157,0.3)] hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50" 
              disabled={loading}
            >
              {loading ? "Création en cours..." : "Créer mon accès"}
            </Button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
              Déjà un compte ? 
              <Link href="/signin" className="text-[#00A09D] ml-2 border-b-2 border-[#00A09D]/20 hover:border-[#00A09D] transition-all font-black">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* SECTION VISUELLE DROITE */}
      <div className="hidden lg:flex w-1/2 bg-[#00A09D] relative p-20 flex-col justify-between overflow-hidden group">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/stock.png" 
            alt="Stock" 
            fill 
            className="object-cover opacity-30 transition-transform duration-1000 group-hover:scale-110" 
            priority 
          />
          <div className="absolute inset-0 bg-gradient-to-bl from-[#00A09D] via-[#00A09D]/80 to-transparent"></div>
        </div>
        
        <div className="relative z-20">
          <div className="flex items-center gap-4 mb-14">
            <div className="bg-white p-3 rounded-[22px] shadow-2xl">
              <div className="w-12 h-12 bg-[#00A09D] rounded-[15px] flex items-center justify-center font-[1000] text-3xl italic text-white shadow-inner">S</div>
            </div>
            <div className="flex flex-col text-white">
              <span className="text-3xl font-[1000] tracking-tighter uppercase leading-none text-white">OCT</span>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-200/80 italic">Smart Solution</span>
            </div>
          </div>
          <h2 className="text-7xl font-[1000] leading-[0.95] text-white tracking-tighter mb-8 uppercase">
            L&apos;excellence <br />
            <span className="text-emerald-300 italic text-6xl lowercase">à chaque flux.</span>
          </h2>
        </div>

        <div className="relative z-20 self-start flex items-center gap-5 bg-white/10 backdrop-blur-xl p-5 rounded-[30px] border border-white/20 transition-transform hover:translate-x-2">
          <div className="w-10 h-10 rounded-full bg-emerald-400 flex items-center justify-center font-black text-[#00A09D] text-lg">✓</div>
          <div className="flex flex-col">
            <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Inscription Ouverte</p>
            <p className="text-[11px] font-bold text-emerald-100/70 uppercase tracking-tighter leading-none">Certifié Logistique @2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}