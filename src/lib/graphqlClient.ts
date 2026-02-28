type GraphQLErrorItem = { message: string };

export async function graphqlRequest<T>(
  query: string,
  variables: Record<string, any> = {},
  options?: { token?: string }
): Promise<T> {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;
  if (!endpoint) throw new Error("Missing NEXT_PUBLIC_GRAPHQL_ENDPOINT");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store", // dev: évite cache Next
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || `HTTP ${res.status}`);
  }

  if (json?.errors?.length) {
    const first = (json.errors as GraphQLErrorItem[])[0];
    throw new Error(first?.message || "GraphQL error");
  }

  return json.data as T;
}