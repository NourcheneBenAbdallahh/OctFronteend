import { describe, expect, it } from "vitest";
import { compareSortValues, sortTableRows } from "./tableSort";

type Row = { name: string; qty: number; at?: string };

const columns = {
  name: { accessor: (r: Row) => r.name, type: "string" as const },
  qty: { accessor: (r: Row) => r.qty, type: "number" as const },
  at: { accessor: (r: Row) => r.at, type: "date" as const },
};

describe("tableSort", () => {
  it("compare les chaînes en français", () => {
    expect(compareSortValues("B", "a", "string")).toBeGreaterThan(0);
  });

  it("place les valeurs vides en fin de liste", () => {
    expect(compareSortValues(null, "x", "string")).toBeGreaterThan(0);
  });

  it("trie un tableau par colonne", () => {
    const rows: Row[] = [
      { name: "c", qty: 2 },
      { name: "a", qty: 5 },
      { name: "b", qty: 1 },
    ];
    const asc = sortTableRows(rows, "name", "asc", columns);
    expect(asc.map((r) => r.name)).toEqual(["a", "b", "c"]);
    const desc = sortTableRows(rows, "qty", "desc", columns);
    expect(desc.map((r) => r.qty)).toEqual([5, 2, 1]);
  });

  it("retourne les lignes inchangées sans tri actif", () => {
    const rows: Row[] = [{ name: "z", qty: 1 }];
    expect(sortTableRows(rows, null, null, columns)).toBe(rows);
  });
});
