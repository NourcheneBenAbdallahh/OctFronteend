import { describe, expect, it } from "vitest";
import { dateToGraphqlDateTime } from "./graphqlDateTime";

describe("dateToGraphqlDateTime", () => {
  it("formate en Y-m-d H:i:s pour Lighthouse", () => {
    const d = new Date(2026, 3, 1, 14, 30, 5);
    expect(dateToGraphqlDateTime(d)).toBe("2026-04-01 14:30:05");
  });
});
