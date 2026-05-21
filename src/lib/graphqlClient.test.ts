/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import {
  friendlyGraphqlMessage,
  getGraphqlEndpoint,
  readPersistedAuthToken,
} from "./graphqlClient";

describe("friendlyGraphqlMessage", () => {
  it("retourne un message par défaut si vide", () => {
    expect(friendlyGraphqlMessage("")).toContain("erreur");
  });

  it("traduit unauthenticated", () => {
    expect(friendlyGraphqlMessage("Unauthenticated.")).toContain("session");
  });

  it("traduit erreur réseau", () => {
    expect(friendlyGraphqlMessage("Failed to fetch")).toContain("réseau");
  });

  it("traduit doublon", () => {
    expect(friendlyGraphqlMessage("The code has already been taken")).toContain("doublon");
  });

  it("masque les erreurs techniques longues", () => {
    expect(friendlyGraphqlMessage("SQLSTATE[HY000]: General error")).toContain(
      "administrateur"
    );
  });

  it("conserve un message court lisible", () => {
    expect(friendlyGraphqlMessage("Email invalide")).toBe("Email invalide");
  });

  it("traduit capacity_unit et champs requis", () => {
    expect(friendlyGraphqlMessage("The selected capacity unit is invalid")).toContain(
      "unité"
    );
    expect(friendlyGraphqlMessage("The field is required")).toContain("obligatoires");
  });
});

describe("getGraphqlEndpoint", () => {
  const orig = process.env;

  afterEach(() => {
    process.env = { ...orig };
  });

  it("utilise NEXT_PUBLIC_GRAPHQL_ENDPOINT dans le navigateur", () => {
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT = "http://browser.test/graphql";
    expect(getGraphqlEndpoint()).toBe("http://browser.test/graphql");
  });
});

describe("readPersistedAuthToken", () => {
  it("lit le token depuis localStorage", () => {
    localStorage.setItem(
      "auth-storage",
      JSON.stringify({ state: { token: "jwt-test" } })
    );
    expect(readPersistedAuthToken()).toBe("jwt-test");
  });

  it("retourne undefined si absent", () => {
    localStorage.clear();
    expect(readPersistedAuthToken()).toBeUndefined();
  });
});
