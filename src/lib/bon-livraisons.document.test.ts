import { afterEach, describe, expect, it } from "vitest";
import {
  getBonLivraisonDocumentUrl,
  guessDocumentKind,
  parseFilenameFromContentDisposition,
} from "./bon-livraisons.document";

describe("bon-livraisons.document", () => {
  const origEnv = process.env;

  afterEach(() => {
    process.env = { ...origEnv };
  });

  it("construit l'URL API du justificatif", () => {
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT = "http://localhost:8000/graphql";
    const url = getBonLivraisonDocumentUrl(42, "attachment");
    expect(url).toBe(
      "http://localhost:8000/api/bon-livraisons/42/document?disposition=attachment"
    );
  });

  it("parse le nom de fichier depuis Content-Disposition", () => {
    expect(
      parseFilenameFromContentDisposition('attachment; filename="scan-bl.pdf"')
    ).toBe("scan-bl.pdf");
    expect(
      parseFilenameFromContentDisposition("inline; filename*=UTF-8''justificatif%20bl.pdf")
    ).toBe("justificatif bl.pdf");
  });

  it("détecte le type pdf ou image", () => {
    expect(guessDocumentKind("application/pdf", "doc.pdf")).toBe("pdf");
    expect(guessDocumentKind("image/jpeg", "photo.jpg")).toBe("image");
    expect(guessDocumentKind("application/octet-stream", "data.bin")).toBe("other");
  });
});
