import { describe, expect, it } from "vitest";
import { isValidEmailFormat } from "./email-validation";

describe("isValidEmailFormat", () => {
  it("accepte un email valide", () => {
    expect(isValidEmailFormat("user@example.com")).toBe(true);
  });

  it("rejette les formats invalides", () => {
    expect(isValidEmailFormat("")).toBe(false);
    expect(isValidEmailFormat("invalid")).toBe(false);
    expect(isValidEmailFormat("@example.com")).toBe(false);
    expect(isValidEmailFormat("user@")).toBe(false);
    expect(isValidEmailFormat("user@domain")).toBe(false);
  });
});
