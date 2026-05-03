/** Cookie miroir du token API pour les Server Components (Next ne lit pas localStorage). */
export const AUTH_ACCESS_TOKEN_COOKIE = "oct_access_token";

const MAX_AGE_SEC = 60 * 60 * 24 * 14; // 14 j

export function syncAuthAccessCookie(token: string | null | undefined): void {
  if (typeof document === "undefined") return;
  if (!token) {
    document.cookie = `${AUTH_ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    return;
  }
  document.cookie = `${AUTH_ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${MAX_AGE_SEC}; SameSite=Lax`;
}
