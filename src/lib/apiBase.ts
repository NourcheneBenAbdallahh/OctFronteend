import { getGraphqlEndpoint } from "@/lib/graphqlClient";

/** Racine API Laravel (sans `/graphql`), ex. `http://localhost:8000`. */
export function getApiBaseUrl(): string {
  const gql = getGraphqlEndpoint().replace(/\/+$/, "");
  if (gql.endsWith("/graphql")) {
    return gql.slice(0, -"/graphql".length);
  }
  return gql;
}
