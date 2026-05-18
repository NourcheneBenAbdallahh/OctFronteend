"use client";
import React from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";

export default function UserAddressCard() {
  const { isOpen, openModal, closeModal } = useModal();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Ta logique de sauvegarde ici
    console.log("Saving changes...");
    closeModal();
  };

  return (
    <>
      <div className="p-6 bg-white border-2 border-gray-100 rounded-[30px] shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-8 bg-[#00A09D] rounded-full"></div>
              <h4 className="text-xl font-[1000] uppercase tracking-tighter text-[#1C2434] dark:text-white">
                Informations de Localisation
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <AddressInfo label="Pays" value="Tunisie" />
              <AddressInfo label="Ville / Gouvernorat" value="_______, ______" />
            </div>
          </div>

          <button
            onClick={openModal}
            className="flex items-center justify-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[#00A09D] transition-all bg-emerald-50 rounded-full hover:bg-[#00A09D] hover:text-white group"
          >
            <svg
              className="transition-transform group-hover:rotate-12"
              width="16"
              height="16"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206Z"
                fill="currentColor"
              />
            </svg>
            Modifier
          </button>
        </div>
      </div>

      {/* MODAL DE MODIFICATION */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px]">
        <div className="relative w-full p-8 bg-white rounded-[35px] dark:bg-[#1C2434]">
          <div className="mb-10">
            <h4 className="text-3xl font-[1000] uppercase tracking-tighter text-[#1C2434] dark:text-white mb-2">
              Éditer l'adresse
            </h4>
            <div className="h-1.5 w-12 bg-[#00A09D] rounded-full"></div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-2 text-gray-400">Pays</Label>
                <Input 
                   type="text" 
                   defaultValue="Tunisie" 
                   className="w-full py-4 px-6 rounded-[20px] border-2 border-gray-100 bg-[#F8FAFA] focus:border-[#00A09D] font-bold text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-2 text-gray-400">Ville / État</Label>
                <Input 
                  type="text" 
                  defaultValue="_______, ______" 
                  className="w-full py-4 px-6 rounded-[20px] border-2 border-gray-100 bg-[#F8FAFA] focus:border-[#00A09D] font-bold text-sm"
                />
              </div>

        

       
            </div>

            <div className="flex items-center gap-4 pt-6">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
              >
                Annuler
              </button>
              <Button 
                className="flex-[2] py-5 bg-[#00A09D] hover:bg-[#008784] text-white font-[1000] text-[11px] uppercase tracking-[0.2em] rounded-[20px] shadow-lg transition-transform hover:-translate-y-1"
              >
                Enregistrer les changements
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}

/** Sous-composant pour l'affichage des infos (scannabilité) */
function AddressInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
        {label}
      </p>
      <p className="text-sm font-bold text-gray-800 dark:text-white/90">
        {value}
      </p>
    </div>
  );
}