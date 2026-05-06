import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import OnboardingAndVerificationCard from "@/components/user-profile/OnboardingAndVerificationCard";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Profil Utilisateur | Système de Gestion OCT",
  description: "Gestion du profil utilisateur pour le suivi des emballages et stocks.",
};

export default function Profile() {
  return (
    <div className="p-4 mx-auto max-w-7xl lg:p-10">
      {/* Header avec ton style typographique puissant */}
      <div className="mb-10">
        <h1 className="text-5xl font-[1000] text-[#1C2434] dark:text-white tracking-[1.5px] uppercase">
          Mon Profil
          <span className="text-[#00A09D]">.</span>
        </h1>
        <p className="mt-2 text-sm font-bold text-gray-400 uppercase tracking-widest">
          Gestion des informations personnelles et sécurité
        </p>
      </div>

      <div className="space-y-8">
        {/* 1. La Meta Card prend toute la largeur en haut (Bannière) */}
        <section>
          <UserMetaCard />
        </section>

        <section>
          <OnboardingAndVerificationCard />
        </section>

        {/* 2. Grid pour les informations détaillées */}
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          {/* Carte Informations Personnelles */}
          <div className="transition-all duration-300 hover:translate-y-[-5px]">
            <UserInfoCard />
          </div>

          {/* Carte Coordonnées / Adresse */}
          <div className="transition-all duration-300 hover:translate-y-[-5px]">
            <UserAddressCard />
          </div>
        </div>
      </div>
    </div>
  );
}