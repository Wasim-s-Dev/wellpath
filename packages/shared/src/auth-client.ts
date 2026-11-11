/**
 * Browser sign-in client shared by the user app and the admin panel.
 * The access token lives only in memory. The httpOnly refresh cookie restores the session on page load.
 * No React here: each app wraps subscribe/getState with useSyncExternalStore.
 */
import type { AuthResponse, LoginInput, PublicUser, RegisterInput } from "./index";

export type AuthState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; user: PublicUser };

export class ApiError extends Error {
  readonly status: number;
  /** Per-field messages from a 400 validation error. */
  readonly fields: Record<string, string[]>;

  constructor(status: number, message: string, fields: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

type AuthClientOptions = {
  /** API origin. Empty when the dev server proxies /api. */
  baseUrl: string;
  /** Where the auth routes are mounted, such as /api/v1/auth. */
  authPath: string;
  /**
   * Optional "probably signed in" flag kept by the app (for example in localStorage).
   * When it is off, page load skips the refresh call, so visitors never trigger a 401.
   */
  sessionHint?: { get(): boolean; set(on: boolean): void };
};

const OFFLINE_MESSAGE = "Cannot reach the server. Check your connection and try again.";

export function createAuthClient({ baseUrl, authPath, sessionHint }: AuthClientOptions) {
  let state: AuthState = { status: "loading" };
  let accessToken: string | null = null;
  let refreshing: Promise<boolean> | null = null;
  const listeners = new Set<() => void>();

  function setState(next: AuthState) {
    state = next;
    listeners.forEach((l) => l());
  }

  function applySession(res: AuthResponse) {
    accessToken = res.accessToken;
    sessionHint?.set(true);
    setState({ status: "signed-in", user: res.user });
  }

  function clearSession() {
    accessToken = null;
    sessionHint?.set(false);
    setState({ status: "signed-out" });
  }

  async function send(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    try {
      return await fetch(`${baseUrl}${path}`, { ...init, headers, credentials: "include" });
    } catch {
      throw new ApiError(0, OFFLINE_MESSAGE);
    }
  }

  async function toError(res: Response): Promise<ApiError> {
    const body = (await res.json().catch(() => null)) as { error?: string; details?: Record<string, string[]> } | null;
    return new ApiError(res.status, body?.error ?? "Something went wrong. Please try again.", body?.details ?? {});
  }

  /**
   * Swaps the refresh cookie for a new access token.
   * Callers share one request: each refresh token works once, so two parallel calls would end the session.
   */
  function refreshSession(): Promise<boolean> {
    refreshing ??= (async () => {
      try {
        const res = await send(`${authPath}/refresh`, { method: "POST" });
        if (!res.ok) {
          clearSession();
          return false;
        }
        applySession((await res.json()) as AuthResponse);
        return true;
      } catch {
        clearSession();
        return false;
      } finally {
        refreshing = null;
      }
    })();
    return refreshing;
  }

  /** Call once on page load. */
  function restoreSession(): Promise<boolean> {
    if (sessionHint && !sessionHint.get()) {
      clearSession();
      return Promise.resolve(false);
    }
    return refreshSession();
  }

  async function postCredentials(path: string, body: LoginInput | RegisterInput): Promise<PublicUser> {
    const res = await send(`${authPath}${path}`, { method: "POST", body: JSON.stringify(body) });
    if (!res.ok) throw await toError(res);
    const session = (await res.json()) as AuthResponse;
    applySession(session);
    return session.user;
  }

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    currentUser: (): PublicUser | null => (state.status === "signed-in" ? state.user : null),
    restoreSession,
    refreshSession,
    login: (input: LoginInput) => postCredentials("/login", input),
    register: (input: RegisterInput) => postCredentials("/register", input),

    async logout(): Promise<void> {
      try {
        await send(`${authPath}/logout`, { method: "POST" });
      } catch {
        // Offline: still forget the session in this tab.
      } finally {
        clearSession();
      }
    },

    /** Calls the API as the signed-in user, refreshing the access token once if it has expired. */
    async api<T>(path: string, init?: RequestInit): Promise<T> {
      let res = await send(path, init);
      if (res.status === 401 && accessToken && (await refreshSession())) res = await send(path, init);
      if (!res.ok) throw await toError(res);
      return (res.status === 204 ? undefined : await res.json()) as T;
    },
  };
}

export type AuthClient = ReturnType<typeof createAuthClient>;
