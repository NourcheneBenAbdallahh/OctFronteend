import { AUTH_ACCESS_TOKEN_COOKIE } from "@/lib/authCookie";

const STORAGE_KEY = "auth-storage";

type GraphQLErrorItem = { message: string };

export type GraphqlRequestOptions = {
  /** Si fourni, ce jeton Prime sur le jeton lu depuis le persist Zustand. */
  token?: string | null;
  /**
   * Ne pas ajouter Authorization (login, register, vérif email, mot de passe oublié, etc.).
   * Évite d’envoyer un ancien Bearer invalide lors d’une nouvelle connexion.
   */
  skipAuth?: boolean;
};

function isUnauthenticatedMessage(message?: string): boolean {
  return typeof message === "string" && message.toLowerCase().includes("unauthenticated");
}

function clearClientSessionAndRedirect(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures and continue cleanup.
  }

  document.cookie = `${AUTH_ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;

  if (!window.location.pathname.startsWith("/signin")) {
    window.location.replace("/signin");
  }
}

/** Lit le token sauvegardé par useAuthStore (persist `auth-storage`) — utile avant fin d’hydratation du store. */
export function readPersistedAuthToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
    const t = parsed?.state?.token;
    return typeof t === "string" && t.length > 0 ? t : undefined;
  } catch {
    return undefined;
  }
}

/** URL HTTP du point d’entrée GraphQL (multipart upload, chatbot custom fetch, etc.). */
export function getGraphqlEndpoint(): string {
  return (
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
    process.env.NEXT_PUBLIC_GRAPHQL_URL ||
    "http://localhost:8000/graphql"
  );
}

function resolveBearer(options?: GraphqlRequestOptions): string | undefined {
  if (options?.skipAuth) return undefined;
  const t = options?.token ?? readPersistedAuthToken();
  return typeof t === "string" && t.length > 0 ? t : undefined;
}

export async function graphqlRequest<T>(
  query: string,
  variables: object = {},
  options?: GraphqlRequestOptions
): Promise<T> {
  const endpoint = getGraphqlEndpoint();
  const bearer = resolveBearer(options);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  let json: { data?: T; errors?: GraphQLErrorItem[]; message?: string };
  try {
    json = await res.json();
  } catch {
    throw new Error(`Réponse GraphQL invalide (HTTP ${res.status}).`);
  }

  if (!res.ok) {
    if (isUnauthenticatedMessage(json?.message)) {
      clearClientSessionAndRedirect();
    }
    throw new Error(json?.message || `HTTP ${res.status}`);
  }

  if (json?.errors?.length) {
    const first = (json.errors as GraphQLErrorItem[])[0];
    if (isUnauthenticatedMessage(first?.message)) {
      clearClientSessionAndRedirect();
    }
    throw new Error(first?.message || "Erreur GraphQL.");
  }

  if (json.data === undefined) {
    throw new Error("Aucune donnée GraphQL retournée.");
  }

  return json.data as T;
}

export async function graphqlMultipartRequest<T>(
  query: string,
  variables: Record<string, unknown>,
  files: Record<string, File>,
  options?: GraphqlRequestOptions
): Promise<T> {
  const endpoint = getGraphqlEndpoint();
  const bearer = resolveBearer(options);
  const formData = new FormData();

  formData.append("operations", JSON.stringify({ query, variables }));

  const map: Record<string, string[]> = {};
  let idx = 0;
  for (const variablePath of Object.keys(files)) {
    map[String(idx)] = [`variables.${variablePath}`];
    idx++;
  }
  formData.append("map", JSON.stringify(map));

  idx = 0;
  for (const file of Object.values(files)) {
    formData.append(String(idx), file);
    idx++;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    },
    body: formData,
    cache: "no-store",
  });

  let json: { data?: T; errors?: GraphQLErrorItem[]; message?: string };
  try {
    json = await res.json();
  } catch {
    throw new Error(`Reponse GraphQL invalide (HTTP ${res.status}).`);
  }

  if (!res.ok) {
    if (isUnauthenticatedMessage(json?.message)) {
      clearClientSessionAndRedirect();
    }
    throw new Error(json?.message || `HTTP ${res.status}`);
  }

  if (json?.errors?.length) {
    const first = (json.errors as GraphQLErrorItem[])[0];
    if (isUnauthenticatedMessage(first?.message)) {
      clearClientSessionAndRedirect();
    }
    throw new Error(first?.message || "Erreur GraphQL.");
  }

  if (json.data === undefined) {
    throw new Error("Aucune donnee GraphQL retournee.");
  }

  return json.data as T;
}
