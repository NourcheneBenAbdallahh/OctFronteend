import { AUTH_ACCESS_TOKEN_COOKIE } from "@/lib/authCookie";

const STORAGE_KEY = "auth-storage";

type GraphQLErrorItem = {
  message: string;
  extensions?: {
    validation?: Record<string, string[] | string>;
    category?: string;
    [key: string]: unknown;
  };
};

/** Erreur GraphQL avec détail de validation (Lighthouse / Laravel), pour affichage utilisateur. */
export class GraphqlRequestError extends Error {
  override readonly name = "GraphqlRequestError";

  constructor(
    message: string,
    public readonly graphqlErrors: GraphQLErrorItem[],
    public readonly validationByField: Record<string, string>
  ) {
    super(message);
  }
}

function normalizeValidationKey(key: string): string {
  return key.replace(/^input\./, "").replace(/^variables\./, "");
}

function mergeGraphqlValidation(errors: GraphQLErrorItem[]): Record<string, string> {
  const out: Record<string, string[]> = {};
  for (const e of errors) {
    const raw = e.extensions?.validation;
    if (!raw || typeof raw !== "object") continue;
    for (const [k, val] of Object.entries(raw)) {
      const key = normalizeValidationKey(k);
      const arr = Array.isArray(val) ? val : [String(val)];
      out[key] = [...(out[key] ?? []), ...arr.map(String)];
    }
  }
  const single: Record<string, string> = {};
  for (const [k, arr] of Object.entries(out)) {
    if (arr.length) single[k] = arr[0] ?? "";
  }
  return single;
}

/** Transforme un message serveur (anglais / technique) en phrase compréhensible pour l’utilisateur final. */
export function friendlyGraphqlMessage(raw: string): string {
  const m = (raw ?? "").trim();
  if (!m) return "Une erreur est survenue. Réessayez dans un instant.";
  if (/unauthenticated|not authenticated/i.test(m)) {
    return "Votre session a expiré. Reconnectez-vous.";
  }
  if (/internal server error|500/i.test(m)) {
    return "Le service est momentanément indisponible. Réessayez plus tard.";
  }
  if (/network|failed to fetch|load failed/i.test(m)) {
    return "Connexion impossible. Vérifiez votre réseau.";
  }
  if (/capacity_unit|selected capacity unit/i.test(m)) {
    return "L’unité de capacité choisie n’est pas valide. Sélectionnez une unité dans la liste.";
  }
  if (/already been taken|unique|duplicate/i.test(m)) {
    return "Cette valeur existe déjà (doublon). Modifiez le code ou le nom.";
  }
  if (/must be (at least|greater|numeric|a number)/i.test(m)) {
    return "Certaines valeurs numériques ne sont pas valides.";
  }
  if (/required/i.test(m)) {
    return "Un ou plusieurs champs obligatoires sont manquants.";
  }
  if (/Validation failed|validation/i.test(m) && m.length < 120) {
    return "Certaines informations ne sont pas acceptées. Vérifiez le formulaire.";
  }
  if (m.length > 200 || /exception|stack|SQLSTATE|vendor\\/i.test(m)) {
    return "L’enregistrement n’a pas pu aboutir. Vérifiez les champs ou contactez l’administrateur.";
  }
  return m;
}

function buildGraphqlUserError(errors: GraphQLErrorItem[]): GraphqlRequestError {
  const validationByField = mergeGraphqlValidation(errors);
  const firstTechnical = errors[0]?.message ?? "Erreur GraphQL.";
  const fromFields = Object.values(validationByField)
    .map((s) => friendlyGraphqlMessage(s))
    .filter(Boolean);
  const summary =
    fromFields.length > 0
      ? fromFields[0] ?? friendlyGraphqlMessage(firstTechnical)
      : friendlyGraphqlMessage(firstTechnical);
  return new GraphqlRequestError(summary, errors, validationByField);
}

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
    throw new Error(friendlyGraphqlMessage(json?.message || `HTTP ${res.status}`));
  }

  if (json?.errors?.length) {
    const errs = json.errors as GraphQLErrorItem[];
    if (isUnauthenticatedMessage(errs[0]?.message)) {
      clearClientSessionAndRedirect();
    }
    throw buildGraphqlUserError(errs);
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
    throw new Error(friendlyGraphqlMessage(json?.message || `HTTP ${res.status}`));
  }

  if (json?.errors?.length) {
    const errs = json.errors as GraphQLErrorItem[];
    if (isUnauthenticatedMessage(errs[0]?.message)) {
      clearClientSessionAndRedirect();
    }
    throw buildGraphqlUserError(errs);
  }

  if (json.data === undefined) {
    throw new Error("Aucune donnee GraphQL retournee.");
  }

  return json.data as T;
}
