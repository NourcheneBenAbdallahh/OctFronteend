"use client";

import { CheckCircle2, Mail } from "lucide-react";
import { Modal } from "@/components/ui/modal";

export type PasswordResetEmailSentInfo = {
  userName: string;
  userEmail: string;
  password: string;
};

export function PasswordResetEmailSentModal({
  info,
  onClose,
}: {
  info: PasswordResetEmailSentInfo | null;
  onClose: () => void;
}) {
  if (!info) return null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      className="max-w-lg rounded-[2rem] p-8"
      showCloseButton
    >
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={32} />
        </div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">
          Email envoyé
        </p>
        <h3 className="mb-2 text-xl font-black tracking-tight text-[#1C2434]">
          Mot de passe réinitialisé
        </h3>
        <p className="text-sm leading-relaxed text-gray-500">
          Un email contenant le nouveau mot de passe a été envoyé à{" "}
          <span className="font-black text-[#1C2434]">{info.userName}</span>.
        </p>

        <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/80 p-5 text-left">
          <div className="mb-4 flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
              <Mail size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Destinataire
              </p>
              <p className="truncate text-sm font-bold text-[#1C2434]">{info.userEmail}</p>
            </div>
          </div>

          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
            Mot de passe envoyé par email
          </p>
          <div className="inline-block w-full rounded-xl border-2 border-dashed border-[#00A09D] bg-white px-4 py-3 text-center font-mono text-lg font-black tracking-wide text-[#1C2434]">
            {info.password}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-gray-400">
            L&apos;utilisateur recevra ce mot de passe dans sa boîte mail. Invitez-le à le modifier
            après sa première connexion.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-8 h-12 w-full rounded-full bg-[#1C2434] px-8 text-[11px] font-black uppercase tracking-widest text-white transition-colors hover:bg-indigo-600 sm:w-auto sm:min-w-[200px]"
        >
          Compris
        </button>
      </div>
    </Modal>
  );
}
