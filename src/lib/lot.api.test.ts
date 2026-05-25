import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Lot } from "@/types/lot";

vi.mock("@/lib/graphqlClient", () => ({
  graphqlRequest: vi.fn(),
}));

import { graphqlRequest } from "@/lib/graphqlClient";
import { deleteLot, getLots, updateLot } from "./lot.api";

const mockedRequest = vi.mocked(graphqlRequest);

const sampleLot: Lot = {
  id: "1",
  code_lot: "LOT-001",
  quantite: 25,
  date_mvt: "2026-05-15T10:00:00",
  emballage_id: "10",
  user_id: "20",
};

describe("lot.api", () => {
  beforeEach(() => {
    mockedRequest.mockReset();
  });

  it("getLots retourne la page demandée", async () => {
    mockedRequest.mockResolvedValue({
      lots: {
        data: [sampleLot],
        paginatorInfo: {
          currentPage: 1,
          lastPage: 2,
          total: 3,
          hasMorePages: true,
        },
      },
    });

    const result = await getLots(1, 12);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].code_lot).toBe("LOT-001");
    expect(result.total).toBe(3);
    expect(result.hasMorePages).toBe(true);
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.stringContaining("query GetLots"),
      { page: 1, first: 12 },
      undefined
    );
  });

  it("updateLot appelle la mutation", async () => {
    mockedRequest.mockResolvedValue({
      updateLot: { ...sampleLot, quantite: 30 },
    });

    const updated = await updateLot("1", { quantite: 30 });

    expect(updated.quantite).toBe(30);
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.stringContaining("mutation UpdateLot"),
      { id: "1", input: { quantite: 30 } }
    );
  });

  it("deleteLot appelle la mutation", async () => {
    mockedRequest.mockResolvedValue({
      deleteLot: { ...sampleLot, id: "99" },
    });

    const deleted = await deleteLot("99");

    expect(deleted.id).toBe("99");
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.stringContaining("mutation DeleteLot"),
      { id: "99" }
    );
  });
});
