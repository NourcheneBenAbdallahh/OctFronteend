import ResetPasswordConfirmForm from "@/components/auth/ResetPasswordConfirmForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Nouveau mot de passe | OCT",
  description: "Définir un nouveau mot de passe",
};

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#00A09D] mx-auto" />
        </div>
      }
    >
      <ResetPasswordConfirmForm />
    </Suspense>
  );
}
