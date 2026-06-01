import { redirect } from "next/navigation";

/** Ancien tableau de bord — redirection vers le tableau BI. */
export default function HomePage() {
  redirect("/bi");
}
