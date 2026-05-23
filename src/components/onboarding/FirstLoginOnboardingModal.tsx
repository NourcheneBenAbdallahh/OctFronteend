"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import {
  countAccessibleModules,
  roleLabel,
} from "@/lib/appOnboarding";
import { countTourSteps } from "@/lib/appTour";
import { defaultHomePath } from "@/lib/access";
import { markOnboardingDone } from "@/lib/onboardingStorage";
import { useAuthStore } from "@/store/useAuthStore";
import { CheckCircle2, Compass, MapPin } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onStartInteractiveTour: () => void;
};

export default function FirstLoginOnboardingModal({
  isOpen,
  onClose,
  onStartInteractiveTour,
}: Props) {
  const user = useAuthStore((s) => s.user);

  const accessibleCount = useMemo(
    () => countAccessibleModules(user?.role),
    [user?.role]
  );

  const tourStepsCount = useMemo(
    () => countTourSteps(user?.role),
    [user?.role]
  );

  const homePath = defaultHomePath(user?.role);

  const handleSkip = () => {
    if (user?.id) markOnboardingDone(user.id);
    onClose();
  };

  const handleStartTour = () => {
    onClose();
    onStartInteractiveTour();
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleSkip}
      className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[32px] p-0"
      showCloseButton
    >
      <div className="border-b border-gray-100 px-8 pb-4 pt-8">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#00A09D]">
          <Compass className="h-3.5 w-3.5" />
          Guide pas à pas
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00A09D]/15 text-[#00A09D]">
          <MapPin className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-[#1C2434]">
          Bienvenue, {user.name.split(" ")[0] || user.name}
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-gray-500">
          La visite guidée vous montre l’application{" "}
          <strong className="text-[#1C2434]">directement à l’écran</strong> :
          chaque zone utile est surlignée (menu, tableau, recherche, boutons).
          Cliquez sur <strong>Suivant</strong> pour passer à l’étape suivante.
        </p>
        <p className="mt-3 text-xs font-semibold text-gray-400">
          Rôle {roleLabel(user.role)} — {accessibleCount} module
          {accessibleCount > 1 ? "s" : ""} — environ {tourStepsCount} étapes
        </p>

        <ul className="mt-6 space-y-2 text-left text-xs font-semibold text-gray-500">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00A09D]" />
            Le guide pointe vers le menu puis ouvre chaque écran
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00A09D]" />
            Vous voyez où lire les tableaux et où taper pour rechercher
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00A09D]" />
            Suivant enchaîne automatiquement sur le module suivant
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-100 bg-white/95 px-6 py-5 backdrop-blur-sm">
        <button
          type="button"
          onClick={handleStartTour}
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#00A09D] text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#00A09D]/25 hover:bg-[#008f8c]"
        >
          Lancer la visite guidée
        </button>

        <Link
          href={homePath}
          onClick={handleSkip}
          className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600"
        >
          Passer pour l’instant
        </Link>
      </div>
    </Modal>
  );
}
