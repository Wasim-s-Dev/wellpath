import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, createAuthClient } from "./auth-client";

const user = { id: "u1", name: "Ama", email: "ama@example.com", role: "user" as const };
const session = (token: string) => ({ accessToken: token, user });
const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function setup(hintOn = true) {
  const hint = { value: hintOn, get: () => hint.value, set: (on: boolean) => void (hint.value = on) };
  const fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetchMock);
  const client = createAuthClient({ baseUrl: "", authPath: "/auth", sessionHint: hint });
  return { client, fetchMock, hint };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("restoreSession", () => {
  it("skips the network for visitors who never signed in", async () => {
    const { client, fetchMock } = setup(false);
    expect(await client.restoreSession()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(client.getState()).toEqual({ status: "signed-out" });
  });

  it("restores a session from the refresh cookie", async () => {
    const { client, fetchMock } = setup(true);
    fetchMock.mockResolvedValueOnce(json(200, session("t1")));
    expect(await client.restoreSession()).toBe(true);
    expect(client.getState()).toEqual({ status: "signed-in", user });
    expect(fetchMock.mock.calls[0][1]?.credentials).toBe("include");
  });

  it("signs out and clears the hint when the cookie is no longer valid", async () => {
    const { client, fetchMock, hint } = setup(true);
    fetchMock.mockResolvedValueOnce(json(401, { error: "Session expired" }));
    expect(await client.restoreSession()).toBe(false);
    expect(client.getState().status).toBe("signed-out");
    expect(hint.value).toBe(false);
  });
});

describe("refreshSession", () => {
  it("sends one request when several callers refresh at once", async () => {
    const { client, fetchMock } = setup();
    fetchMock.mockResolvedValueOnce(json(200, session("t1")));
    const results = await Promise.all([client.refreshSession(), client.refreshSession(), client.refreshSession()]);
    expect(results).toEqual([true, true, true]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("login", () => {
  it("passes on the API's message and field errors", async () => {
    const { client, fetchMock } = setup(false);
    fetchMock.mockResolvedValueOnce(json(400, { error: "Validation failed", details: { email: ["Enter a valid email address"] } }));
    const err = await client.login({ email: "x", password: "y" }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(400);
    expect((err as ApiError).fields.email).toEqual(["Enter a valid email address"]);
  });

  it("reports a clear message when the server cannot be reached", async () => {
    const { client, fetchMock } = setup(false);
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const err = (await client.login({ email: "a@b.co", password: "pw" }).catch((e: unknown) => e)) as ApiError;
    expect(err.status).toBe(0);
    expect(err.message).toMatch(/Cannot reach the server/);
  });

  it("signs in and sets the hint", async () => {
    const { client, fetchMock, hint } = setup(false);
    fetchMock.mockResolvedValueOnce(json(200, session("t1")));
    await client.login({ email: user.email, password: "pw" });
    expect(client.currentUser()).toEqual(user);
    expect(hint.value).toBe(true);
  });
});

describe("api", () => {
  it("refreshes an expired access token once and retries with the new one", async () => {
    const { client, fetchMock } = setup(false);
    fetchMock
      .mockResolvedValueOnce(json(200, session("old")))
      .mockResolvedValueOnce(json(401, { error: "Not signed in" }))
      .mockResolvedValueOnce(json(200, session("new")))
      .mockResolvedValueOnce(json(200, { ok: true }));
    await client.login({ email: user.email, password: "pw" });
    expect(await client.api("/thing")).toEqual({ ok: true });
    const auth = (i: number) => new Headers(fetchMock.mock.calls[i][1]?.headers).get("Authorization");
    expect(auth(1)).toBe("Bearer old");
    expect(auth(3)).toBe("Bearer new");
  });
});

describe("logout", () => {
  it("forgets the session even when the server cannot be reached", async () => {
    const { client, fetchMock, hint } = setup(false);
    fetchMock.mockResolvedValueOnce(json(200, session("t1"))).mockRejectedValueOnce(new TypeError("offline"));
    await client.login({ email: user.email, password: "pw" });
    await client.logout();
    expect(client.getState().status).toBe("signed-out");
    expect(hint.value).toBe(false);
  });
});
