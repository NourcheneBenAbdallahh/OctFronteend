import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MouvementStock } from "@/types/mouvement";

vi.mock("@/lib/graphqlClient", () => ({
  graphqlRequest: vi.fn(),
}));

import { graphqlRequest } from "@/lib/graphqlClient";
import {
  createMouvementDraft,
  deleteMouvementDraft,
  fetchMouvements,
  validateMouvement,
} from "./mouvement.api";

const mockedRequest = vi.mocked(graphqlRequest);

const sampleMouvement: MouvementStock = {
  id: "1",
  type_mouvement: "SPL",
  emballage_id: "10",
  quantite: 5,
  statut: "BROUILLON",
  code_mouvement: "MVMT-001",
};

describe("mouvement.api", () => {
  beforeEach(() => {
    mockedRequest.mockReset();
  });

  it("fetchMouvements retourne data et paginatorInfo", async () => {
    mockedRequest.mockResolvedValue({
      mouvementStocks: {
        data: [sampleMouvement],
        paginatorInfo: {
          currentPage: 1,
          lastPage: 2,
          total: 11,
          perPage: 10,
          hasMorePages: true,
        },
      },
    });

    const result = await fetchMouvements({
      search: "MVMT",
      type: "SPL",
      statut: "BROUILLON",
      page: 1,
      first: 10,
    });

    expect(result.data).toHaveLength(1);
    expect(result.paginatorInfo.total).toBe(11);
    expect(result.paginatorInfo.hasMorePages).toBe(true);
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.stringContaining("mouvementStocks"),
      {
        first: 10,
        page: 1,
        search: "MVMT",
        type: "SPL",
        statut: "BROUILLON",
        orderBy: [{ column: "DATE_MOUVEMENT", order: "DESC" }],
      }
    );
  });

  it("fetchMouvements omet type et statut quand ALL", async () => {
    mockedRequest.mockResolvedValue({
      mouvementStocks: {
        data: [],
        paginatorInfo: {
          currentPage: 1,
          lastPage: 1,
          total: 0,
          perPage: 10,
          hasMorePages: false,
        },
      },
    });

    await fetchMouvements({ type: "ALL", statut: "ALL", page: 2, first: 10 });

    expect(mockedRequest).toHaveBeenCalledWith(expect.any(String), {
      first: 10,
      page: 2,
      orderBy: [{ column: "DATE_MOUVEMENT", order: "DESC" }],
    });
  });

  it("fetchMouvements envoie ASC quand sort oldest", async () => {
    mockedRequest.mockResolvedValue({
      mouvementStocks: {
        data: [],
        paginatorInfo: {
          currentPage: 1,
          lastPage: 1,
          total: 0,
          perPage: 10,
          hasMorePages: false,
        },
      },
    });

    await fetchMouvements({ sort: "oldest", page: 1, first: 10 });

    expect(mockedRequest).toHaveBeenCalledWith(expect.any(String), {
      first: 10,
      page: 1,
      orderBy: [{ column: "DATE_MOUVEMENT", order: "ASC" }],
    });
  });

  it("createMouvementDraft appelle la mutation", async () => {
    mockedRequest.mockResolvedValue({
      createMouvementDraft: { id: "42", code_mouvement: "MVMT-X", statut: "BROUILLON" },
    });

    await createMouvementDraft({
      type_mouvement: "SPL",
      emballage_id: "10",
      entrepot_destination_id: "20",
      quantite: 7,
    });

    expect(mockedRequest).toHaveBeenCalledWith(
      expect.stringContaining("createMouvementDraft"),
      {
        input: {
          type_mouvement: "SPL",
          emballage_id: "10",
          entrepot_destination_id: "20",
          quantite: 7,
        },
      }
    );
  });

  it("validateMouvement appelle la mutation", async () => {
    mockedRequest.mockResolvedValue({
      validateMouvement: { id: "5", statut: "VALIDE" },
    });

    await validateMouvement("5");

    expect(mockedRequest).toHaveBeenCalledWith(
      expect.stringContaining("validateMouvement"),
      { input: { id: "5" } }
    );
  });

  it("deleteMouvementDraft appelle la mutation", async () => {
    mockedRequest.mockResolvedValue({ deleteMouvementDraft: true });

    await deleteMouvementDraft("99");

    expect(mockedRequest).toHaveBeenCalledWith(
      expect.stringContaining("deleteMouvementDraft"),
      { id: "99" }
    );
  });
});
