import "server-only";

import { cookies } from "next/headers";
import { AUTH_ACCESS_TOKEN_COOKIE } from "@/lib/authCookie";

export async function getServerAccessToken(): Promise<string | undefined> {
  const jar = await cookies();
  const v = jar.get(AUTH_ACCESS_TOKEN_COOKIE)?.value;
  return v && v.length > 0 ? v : undefined;
}
