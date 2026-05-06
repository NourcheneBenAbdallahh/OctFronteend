import "server-only";

import { redirect } from "next/navigation";
import { getServerAccessToken } from "@/lib/getServerAccessToken";

export async function requireServerAccessToken(): Promise<string> {
  const token = await getServerAccessToken();
  if (!token) {
    redirect("/signin");
  }
  return token;
}
