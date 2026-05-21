/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "./useAuthStore";

describe("useAuthStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });

  it("setAuth enregistre utilisateur et token", () => {
    useAuthStore.getState().setAuth(
      {
        id: "1",
        name: "Test",
        email: "t@test.com",
        role: "STOCK",
      },
      "token-abc"
    );

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe("token-abc");
    expect(state.user?.role).toBe("STOCK");
  });

  it("logout réinitialise la session", () => {
    useAuthStore.getState().setAuth(
      { id: "1", name: "A", email: "a@t.com", role: "ADMIN" },
      "tok"
    );
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });
});
