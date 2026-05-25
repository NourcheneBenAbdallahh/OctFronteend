import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mot de passe oublié | OCT",
  description: "Réinitialiser votre mot de passe OCT",
};

export default function ResetPasswordPage() {
  return <ForgotPasswordForm />;
}
