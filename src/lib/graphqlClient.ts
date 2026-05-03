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

function graphqlEndpoint(): string {
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
  variables: Record<string, unknown> = {},
  options?: GraphqlRequestOptions
): Promise<T> {
  const endpoint = graphqlEndpoint();
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
    throw new Error(json?.message || `HTTP ${res.status}`);
  }

  if (json?.errors?.length) {
    const first = (json.errors as GraphQLErrorItem[])[0];
    throw new Error(first?.message || "Erreur GraphQL.");
  }

  if (json.data === undefined) {
    throw new Error("Aucune donnée GraphQL retournée.");
  }

  return json.data as T;
}
