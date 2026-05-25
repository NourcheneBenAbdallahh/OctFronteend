import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Stock } from "@/types/stock";

vi.mock("@/lib/graphqlClient", () => ({
  graphqlRequest: vi.fn(),
}));

import { graphqlRequest } from "@/lib/graphqlClient";
import {
  deleteStock,
  getAllStocks,
  getStocks,
  updateStock,
} from "./stock.api";

const mockedRequest = vi.mocked(graphqlRequest);

const sampleStock: Stock = {
  id: "1",
  entrepot_id: "10",
  emballage_id: "20",
  date_stock: "2026-05-15T10:00:00",
  quantite: 12,
  sens: "entree",
};

describe("stock.api", () => {
  beforeEach(() => {
    mockedRequest.mockReset();
  });

  it("getStocks retourne la page demandée", async () => {
    mockedRequest.mockResolvedValue({
      stocks: {
        data: [sampleStock],
        paginatorInfo: {
          currentPage: 1,
          lastPage: 1,
          total: 1,
          hasMorePages: false,
        },
      },
    });

    const rows = await getStocks(1, 50);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("1");
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.stringContaining("query GetStocks"),
      { page: 1, first: 50 },
      undefined
    );
  });

  it("getAllStocks agrège plusieurs pages", async () => {
    mockedRequest
      .mockResolvedValueOnce({
        stocks: {
          data: [{ ...sampleStock, id: "1" }],
          paginatorInfo: {
            currentPage: 1,
            lastPage: 2,
            total: 2,
            hasMorePages: true,
          },
        },
      })
      .mockResolvedValueOnce({
        stocks: {
          data: [{ ...sampleStock, id: "2" }],
          paginatorInfo: {
            currentPage: 2,
            lastPage: 2,
            total: 2,
            hasMorePages: false,
          },
        },
      });

    const rows = await getAllStocks(1, 10);
    expect(rows.map((r) => r.id)).toEqual(["1", "2"]);
    expect(mockedRequest).toHaveBeenCalledTimes(2);
  });

  it("updateStock appelle la mutation", async () => {
    mockedRequest.mockResolvedValue({
      updateStock: { ...sampleStock, quantite: 20, sens: "sortie" },
    });

    const updated = await updateStock("1", { quantite: 20, sens: "sortie" });
    expect(updated.quantite).toBe(20);
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.stringContaining("mutation UpdateStock"),
      { id: "1", input: { quantite: 20, sens: "sortie" } }
    );
  });

  it("deleteStock appelle la mutation", async () => {
    mockedRequest.mockResolvedValue({
      deleteStock: { ...sampleStock, id: "99" },
    });

    const deleted = await deleteStock("99");
    expect(deleted.id).toBe("99");
    expect(mockedRequest).toHaveBeenCalledWith(
      expect.stringContaining("mutation DeleteStock"),
      { id: "99" }
    );
  });
});
