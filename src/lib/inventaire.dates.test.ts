import { describe, expect, it } from "vitest";
import { dayScopeBounds, localDayKey, normalizeIsoDay, rowMatchesDateMode } from "./inventaire.dates";

describe("inventaire.dates", () => {
  it("localDayKey extrait le jour calendaire local", () => {
    expect(localDayKey("2026-06-28 12:00:00")).toBe("2026-06-28");
    expect(localDayKey("2026-06-28T11:00:00.000000Z")).toBe("2026-06-28");
  });

  it("normalizeIsoDay retombe sur aujourd'hui si vide", () => {
    expect(normalizeIsoDay("")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dayScopeBounds("").dateInventaire).toMatch(/^\d{4}-\d{2}-\d{2} 12:00:00$/);
  });

  it("rowMatchesDateMode jour compare la clé calendaire", () => {
    expect(
      rowMatchesDateMode(
        "2026-06-28T11:00:00.000000Z",
        null,
        null,
        "day",
        "2026-06-28",
        ""
      )
    ).toBe(true);
    expect(
      rowMatchesDateMode(
        "2026-06-28T11:00:00.000000Z",
        null,
        null,
        "day",
        "2026-06-27",
        ""
      )
    ).toBe(false);
  });
});
