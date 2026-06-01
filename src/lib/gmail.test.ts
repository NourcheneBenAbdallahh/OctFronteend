import { describe, expect, it } from "vitest";
import { buildGmailComposeUrl } from "./gmail";

describe("buildGmailComposeUrl", () => {
  it("encode le destinataire", () => {
    const url = buildGmailComposeUrl("contact@oct.tn");
    expect(url).toContain("view=cm");
    expect(url).toContain("to=contact%40oct.tn");
  });

  it("ajoute sujet et corps", () => {
    const url = buildGmailComposeUrl("a@b.co", {
      subject: "Contrat OCT-1",
      body: "Bonjour,",
    });
    expect(url).toContain("su=Contrat+OCT-1");
    expect(url).toContain("body=Bonjour%2C");
  });
});
