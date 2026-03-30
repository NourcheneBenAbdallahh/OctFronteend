"use client";
import React from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { user } = useAuthStore();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Saving metadata...");
    closeModal();
  };

  return (
    <>
      <div className="p-6 bg-white border-2 border-gray-100 rounded-[30px] shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            {/* Avatar avec bague de statut Teal */}
            <div className="relative">
              <div className="w-24 h-24 p-1 overflow-hidden border-2 border-[#00A09D] rounded-full">
                <Image
                  width={96}
                  height={96}
                  src={user?.photo || "/images/user/owner.png"}
                  alt="user"
                  className="object-cover w-full h-full rounded-full"
                />
              </div>
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full dark:border-gray-900"></div>
            </div>

            <div className="order-3 xl:order-2">
              <h4 className="mb-1 text-2xl font-[1000] uppercase tracking-tighter text-center text-[#1C2434] dark:text-white xl:text-left">
                {user?.name || "Chargement..."}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#00A09D]">
                  {user?.role || "Administrateur"}
                </p>
             
              </div>
            </div>

           
          </div>

          <button
            onClick={openModal}
className="bg-white text-[#1C2434] border-2 border-[#1C2434] px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#1C2434] hover:text-white transition-all shadow-[6px_6px_0px_rgba(0,160,157,0.3)] active:translate-y-1 active:shadow-none"          >
            Modifier le Profil
          </button>

           
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px]">
        <div className="relative w-full p-8 bg-white rounded-[35px] dark:bg-[#1C2434] max-h-[90vh] overflow-y-auto no-scrollbar">
          <div className="mb-10 text-center xl:text-left">
            <h4 className="text-3xl font-[1000] uppercase tracking-tighter text-[#1C2434] dark:text-white mb-2">
              Paramètres du Compte
            </h4>
            <div className="h-1.5 w-16 bg-[#00A09D] rounded-full mx-auto xl:mx-0"></div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Zone Upload Photo (Look Moderne) */}
            <div className="p-6 border-2 border-dashed border-gray-100 rounded-[25px] flex flex-col items-center gap-4 bg-[#F8FAFA] dark:bg-white/5">
                <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden">
                    <Image width={80} height={80} src={user?.photo || "/images/user/owner.png"} alt="preview" />
                </div>
                <button type="button" className="text-[10px] font-black uppercase tracking-widest text-[#00A09D]">
                    Changer la photo de profil
                </button>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-2 text-gray-400">Nom Complet</Label>
                <Input type="text" defaultValue={user?.name} className="rounded-[20px] py-4 bg-[#F8FAFA] border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-2 text-gray-400">Titre / Poste</Label>
                <Input type="text" defaultValue={user?.role} className="rounded-[20px] py-4 bg-[#F8FAFA] border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-2 text-gray-400">Localisation</Label>
                <Input type="text" defaultValue="******" className="rounded-[20px] py-4 bg-[#F8FAFA] border-none font-bold" />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button onClick={closeModal} variant="outline" className="flex-1 rounded-[20px] py-4 text-[10px] font-black uppercase tracking-widest border-2">
                Fermer
              </Button>
              <Button className="flex-[2] py-5 bg-[#00A09D] text-white font-[1000] text-[11px] uppercase tracking-[0.2em] rounded-[22px] shadow-xl">
                Sauvegarder
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}

// Composant utilitaire pour les réseaux sociaux
function SocialCircle({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-50 bg-white text-gray-400 transition-all hover:border-[#00A09D] hover:text-[#00A09D] shadow-sm"
    >
      {icon}
    </a>
  );
}

/* Icônes simplifiées pour le design */
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M11.6666 11.2503H13.7499L14.5833 7.91699H11.6666V6.25033C11.6666 5.39251 11.6666 4.58366 13.3333 4.58366H14.5833V1.78374C14.3118 1.7477 13.2858 1.66699 12.2023 1.66699C9.94025 1.66699 8.33325 3.04771 8.33325 5.58342V7.91699H5.83325V11.2503H8.33325V18.3337H11.6666V11.2503Z" /></svg>
);
const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M15.1708 1.875H17.9274L11.9049 8.75833L18.9899 18.125H13.4424L9.09742 12.4442L4.12578 18.125H1.36745L7.80912 10.7625L1.01245 1.875H6.70078L10.6283 7.0675L15.1708 1.875ZM14.2033 16.475H15.7308L5.87078 3.43833H4.23162L14.2033 16.475Z" /></svg>
);
const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M5.78381 4.16645C5.78351 4.84504 5.37181 5.45569 4.74286 5.71045C4.11391 5.96521 3.39331 5.81321 2.92083 5.32613C2.44836 4.83904 2.31837 4.11413 2.59216 3.49323C2.86596 2.87233 3.48886 2.47942 4.16715 2.49978C5.06804 2.52682 5.78422 3.26515 5.78381 4.16645ZM5.83381 7.06645H2.50048V17.4998H5.83381V7.06645ZM11.1005 7.06645H7.78381V17.4998H11.0672V12.0248C11.0672 8.97475 15.0422 8.69142 15.0422 12.0248V17.4998H18.3338V10.8914C18.3338 5.74978 12.4505 5.94145 11.0672 8.46642L11.1005 7.06645Z" /></svg>
);