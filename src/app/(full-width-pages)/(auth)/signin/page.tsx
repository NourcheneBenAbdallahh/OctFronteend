import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connexion à l'application OCT de gestion d'emballages.",
};

export default function SignIn() {
  return <SignInForm />;
}
