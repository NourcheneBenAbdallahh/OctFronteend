/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import { AUTH_ACCESS_TOKEN_COOKIE, syncAuthAccessCookie } from "./authCookie";

describe("authCookie", () => {
  afterEach(() => {
    document.cookie = `${AUTH_ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0`;
  });

  it("écrit le cookie token encodé", () => {
    syncAuthAccessCookie("abc.def");
    expect(document.cookie).toContain(AUTH_ACCESS_TOKEN_COOKIE);
    expect(document.cookie).toContain(encodeURIComponent("abc.def"));
  });

  it("efface le cookie si token null", () => {
    syncAuthAccessCookie("temp");
    syncAuthAccessCookie(null);
    expect(document.cookie).not.toContain("temp");
  });
});
