import { describe, expect, it } from "vitest";
import { GraphqlRequestError } from "@/lib/graphqlClient";
import { getInventaireErrorMessage } from "./inventaire.errors";

describe("getInventaireErrorMessage", () => {
  it("masque les erreurs GraphQL techniques", () => {
    const err = new GraphqlRequestError(
      'Variable "$input" got invalid value "12:00:00" at "input.date_inventaire"; Unexpected data found.',
      [],
      {}
    );
    expect(getInventaireErrorMessage(err, "Erreur lors de la génération.")).toBe(
      "La date d'inventaire n'est pas valide. Choisissez un jour dans le calendrier."
    );
    expect(
      getInventaireErrorMessage(err, "Erreur lors de la génération.")
    ).not.toContain("Variable");
  });

  it("utilise le fallback si le message reste technique", () => {
    const err = new GraphqlRequestError("GraphQL error: internal server failure", [], {});
    expect(getInventaireErrorMessage(err, "Impossible de charger les lignes.")).toBe(
      "Impossible de charger les lignes."
    );
  });
});
