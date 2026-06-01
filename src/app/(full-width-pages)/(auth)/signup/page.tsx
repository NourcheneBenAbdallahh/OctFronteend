import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inscription",
  description: "Création de compte pour l'application OCT de gestion d'emballages.",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
