import { describe, expect, it } from "vitest";
import { friendlyGraphqlMessage } from "./graphqlClient";

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
});
