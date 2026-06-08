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

const DUPLICATE_PATTERN =
  /already been taken|has already been|unique|duplicate|déjà été pris|déjà été utilisé|déjà pris|existe déjà/i;

function inferDuplicateField(message: string, fieldHint?: string): string {
  const hint = (fieldHint ?? "").toLowerCase();
  if (hint) return hint;

  const m = message.toLowerCase();
  if (/\b(email|e-mail|courriel|mail)\b/.test(m)) return "email";
  if (/\b(code)\b/.test(m)) return "code";
  if (/\b(name|nom)\b/.test(m)) return "name";
  if (/matricule/.test(m)) return "matricule_fiscale";
  if (/numero_contrat|numéro de contrat|contract number/.test(m)) return "numero_contrat";
  if (/telephone|téléphone|phone/.test(m)) return "telephone";

  return "";
}

/** Message utilisateur pour une contrainte d’unicité (doublon). */
export function friendlyDuplicateMessage(message: string, fieldHint?: string): string {
  const field = inferDuplicateField(message, fieldHint);

  if (field.includes("email") || /\b(email|e-mail|courriel)\b/i.test(message)) {
    return "Cette adresse e-mail existe déjà.";
  }
  if (field === "code" || /\bcode\b/i.test(message)) {
    return "Ce code existe déjà.";
  }
  if (field === "name" || /\bname\b/i.test(message)) {
    return "Ce nom existe déjà.";
  }
  if (field.includes("matricule")) {
    return "Ce matricule fiscal existe déjà.";
  }
  if (field.includes("numero_contrat") || field.includes("contrat")) {
    return "Ce numéro de contrat existe déjà.";
  }
  if (field.includes("telephone") || field.includes("phone")) {
    return "Ce numéro de téléphone existe déjà.";
  }

  return "Cette valeur existe déjà.";
}

/** Transforme un message serveur (anglais / technique) en phrase compréhensible pour l’utilisateur final. */
export function friendlyGraphqlMessage(raw: string, fieldHint?: string): string {
  const m = (raw ?? "").trim();
  if (!m) return "Une erreur est survenue. Réessayez dans un instant.";
  if (/unauthenticated|not authenticated/i.test(m)) {
    return "Votre session a expiré. Reconnectez-vous.";
  }
  if (
    /aucune sortie|sorties enregistrées|mouvements validés|historique trop court/i.test(
      m
    )
  ) {
    return m;
  }
  if (/historique insuffisant|pas assez de données/i.test(m)) {
    return m.length > 220
      ? "Pas assez de jours avec des sorties validées. Enregistrez des sorties dans « Mouvements de stock »."
      : m;
  }
  if (/analyse prédictive|service d'analyse/i.test(m)) {
    return m;
  }
  if (/internal server error|500|502|503|504/i.test(m)) {
    return "Le service est momentanément indisponible. Réessayez plus tard.";
  }
  if (
    /network|failed to fetch|load failed|connection refused|econnrefused|enotfound|erreur réseau/i.test(
      m
    )
  ) {
    return "Connexion impossible au serveur. Vérifiez que le backend tourne (port 8000) et réessayez.";
  }
  if (/capacity_unit|selected capacity unit/i.test(m)) {
    return "L’unité de capacité choisie n’est pas valide. Sélectionnez une unité dans la liste.";
  }
  if (DUPLICATE_PATTERN.test(m)) {
    return friendlyDuplicateMessage(m, fieldHint);
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
  const fromFields = Object.entries(validationByField)
    .map(([field, s]) => friendlyGraphqlMessage(s, field))
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

  const path = window.location.pathname;
  const isPublicAuthPage =
    path.startsWith("/signin") ||
    path.startsWith("/signup") ||
    path.startsWith("/reset-password") ||
    path.startsWith("/verify-email");

  if (!isPublicAuthPage) {
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

const DEFAULT_GRAPHQL_ENDPOINT = "http://localhost:8000/graphql";
const DEFAULT_GRAPHQL_PORT = "8000";

const LOCAL_PAGE_HOSTS = new Set(["localhost", "127.0.0.1"]);

/** Hôtes tunnel publics (Cloudflare quick tunnel, ngrok, etc.). */
const PUBLIC_TUNNEL_HOST_PATTERN =
  /\.(trycloudflare\.com|ngrok-free\.app|ngrok\.io|ngrok\.app)$/i;

function readExplicitPublicGraphqlEndpoint(): string | undefined {
  const url =
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT?.trim() ||
    process.env.NEXT_PUBLIC_GRAPHQL_URL?.trim();
  return url || undefined;
}

/** URL backend tunnel injectée à l’exécution (meta), si le build a encore localhost. */
function readRuntimeGraphqlEndpointFromMeta(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const content = document
    .querySelector('meta[name="oct-graphql-endpoint"]')
    ?.getAttribute("content")
    ?.trim();
  if (!content) return undefined;
  try {
    return new URL(content).toString();
  } catch {
    return undefined;
  }
}

function isPublicTunnelHost(hostname: string): boolean {
  return PUBLIC_TUNNEL_HOST_PATTERN.test(hostname);
}

/**
 * Navigateur : API sur le même hôte que la page (port 8000).
 * Évite d’appeler une IP LAN figée au build quand on ouvre http://localhost:3000.
 */
function browserGraphqlEndpointFromLocation(): string {
  const { hostname, protocol } = window.location;
  const port =
    process.env.NEXT_PUBLIC_GRAPHQL_PORT?.trim() || DEFAULT_GRAPHQL_PORT;
  return `${protocol}//${hostname}:${port}/graphql`;
}

/**
 * Cloudflare / ngrok : front et API ont des URLs différentes → utiliser NEXT_PUBLIC_*.
 * localhost / LAN : garder le même hôte que la page (port 8000).
 */
export function shouldUseExplicitBrowserGraphqlEndpoint(
  explicit: string,
  pageHostname: string
): boolean {
  if (LOCAL_PAGE_HOSTS.has(pageHostname)) {
    return false;
  }
  try {
    const explicitUrl = new URL(explicit);
    if (explicitUrl.hostname === pageHostname) {
      return false;
    }
    if (explicitUrl.protocol === "https:") {
      return true;
    }
    return PUBLIC_TUNNEL_HOST_PATTERN.test(explicitUrl.hostname);
  } catch {
    return false;
  }
}

function resolveBrowserGraphqlEndpoint(): string {
  const pageHostname = window.location.hostname;
  const explicit = readExplicitPublicGraphqlEndpoint();

  // Front tunnel Cloudflare/ngrok : l’API est sur une autre URL, jamais :8000 sur le front.
  if (isPublicTunnelHost(pageHostname)) {
    const runtime = readRuntimeGraphqlEndpointFromMeta();
    if (runtime) return runtime;
    if (
      explicit &&
      shouldUseExplicitBrowserGraphqlEndpoint(explicit, pageHostname)
    ) {
      return explicit;
    }
  }

  if (
    explicit &&
    shouldUseExplicitBrowserGraphqlEndpoint(explicit, pageHostname)
  ) {
    return explicit;
  }
  return browserGraphqlEndpointFromLocation();
}

function publicGraphqlEndpoint(): string {
  return (
    readExplicitPublicGraphqlEndpoint() ||
    browserGraphqlEndpointFromLocation() ||
    DEFAULT_GRAPHQL_ENDPOINT
  );
}

/**
 * URL GraphQL selon le contexte :
 * - Serveur (SSR dans Docker) : GRAPHQL_ENDPOINT → ex. host.docker.internal
 * - Navigateur : même hôte:8000 (LAN) ou NEXT_PUBLIC_* (tunnel HTTPS)
 */
export function getGraphqlEndpoint(): string {
  if (typeof window !== "undefined") {
    return resolveBrowserGraphqlEndpoint();
  }
  return process.env.GRAPHQL_ENDPOINT || publicGraphqlEndpoint();
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

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(friendlyGraphqlMessage(msg));
  }

  let json: { data?: T; errors?: GraphQLErrorItem[]; message?: string };
  try {
    json = await res.json();
  } catch {
    throw new Error(
      friendlyGraphqlMessage(
        res.status >= 500 ? `HTTP ${res.status}` : `Réponse GraphQL invalide (HTTP ${res.status}).`
      )
    );
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

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
      body: formData,
      cache: "no-store",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(friendlyGraphqlMessage(msg));
  }

  let json: { data?: T; errors?: GraphQLErrorItem[]; message?: string };
  try {
    json = await res.json();
  } catch {
    throw new Error(
      friendlyGraphqlMessage(
        res.status >= 500 ? `HTTP ${res.status}` : `Reponse GraphQL invalide (HTTP ${res.status}).`
      )
    );
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
