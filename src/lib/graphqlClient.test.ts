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
    expect(friendlyGraphqlMessage("Failed to fetch")).toContain("backend");
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

  it("utilise localhost:8000 quand la page est sur localhost", () => {
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT = "http://192.168.100.19:8000/graphql";
    Object.defineProperty(window, "location", {
      value: { hostname: "localhost", protocol: "http:", port: "3000" },
      configurable: true,
    });
    expect(getGraphqlEndpoint()).toBe("http://localhost:8000/graphql");
  });

  it("utilise l'hôte de la page en LAN (autre IP que localhost)", () => {
    delete process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;
    Object.defineProperty(window, "location", {
      value: {
        hostname: "192.168.12.101",
        protocol: "http:",
        port: "3000",
      },
      configurable: true,
    });
    expect(getGraphqlEndpoint()).toBe("http://192.168.12.101:8000/graphql");
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
