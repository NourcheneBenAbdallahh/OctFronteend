import { afterEach, describe, expect, it } from "vitest";
import { getGraphqlEndpoint } from "./graphqlClient";

describe("getGraphqlEndpoint (serveur)", () => {
  const orig = process.env;

  afterEach(() => {
    process.env = { ...orig };
  });

  it("utilise GRAPHQL_ENDPOINT hors navigateur", () => {
    process.env.GRAPHQL_ENDPOINT = "http://api.internal/graphql";
    delete process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;
    expect(getGraphqlEndpoint()).toBe("http://api.internal/graphql");
  });
});
