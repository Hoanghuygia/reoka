// Client for the backend's /app router.
//
// The session token lives in memory only. It expires after one hour, and the
// app gets a new one by logging in again through Zalo without asking the user
// (docs/decisions.md D8). So a 401 triggers one silent re-login and a retry.

import { authorize, getAccessToken } from "zmp-sdk";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

export type User = {
  id: string;
  name: string | null;
};

export type Session = {
  token: string;
  user: User;
};

export type Gender = "male" | "female" | "unknown";

export type Pet = {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed: string | null;
  gender: Gender;
  birth_date: string | null;
  color: string | null;
  public_code: string;
  created_at: string;
};

/** A failed call. `code` is the backend's error code, or a client-side one. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let session: Session | null = null;
let loginInFlight: Promise<Session> | null = null;

/** Logs in with the Zalo access token. Concurrent callers share one request. */
export function login(): Promise<Session> {
  if (loginInFlight) return loginInFlight;
  const pending = doLogin();
  loginInFlight = pending;
  const clear = () => {
    loginInFlight = null;
  };
  pending.then(clear, clear);
  return pending;
}

async function doLogin(): Promise<Session> {
  const accessToken = await zaloAccessToken();
  session = await send<Session>("/app/auth/zalo", {
    method: "POST",
    body: JSON.stringify({ access_token: accessToken }),
  });
  return session;
}

/**
 * Gets the user's Zalo access token. If Zalo gives none, asks the user for
 * `scope.userInfo` and tries once more: a Zalo App with several Mini Apps needs
 * consent even for the token, and the scope also gives us the user's name.
 */
async function zaloAccessToken(): Promise<string> {
  try {
    const token = await getAccessToken();
    if (token) return token;
    console.warn("[login] getAccessToken returned an empty token");
  } catch (error) {
    console.warn("[login] getAccessToken failed", describe(error));
  }

  try {
    await authorize({ scopes: ["scope.userInfo"] });
  } catch (error) {
    console.error("[login] authorize(scope.userInfo) failed", describe(error));
    throw new ApiError(0, "zalo_sdk_error", `authorize: ${describe(error)}`);
  }

  try {
    const token = await getAccessToken();
    if (token) return token;
  } catch (error) {
    console.error("[login] getAccessToken failed after authorize", describe(error));
    throw new ApiError(0, "zalo_sdk_error", `getAccessToken: ${describe(error)}`);
  }
  console.error("[login] getAccessToken still empty after authorize");
  throw new ApiError(0, "zalo_sdk_error", "getAccessToken returned an empty token");
}

export function listPets(): Promise<Pet[]> {
  return authed<Pet[]>("/app/pets");
}

export function getPet(id: string): Promise<Pet> {
  return authed<Pet>(`/app/pets/${encodeURIComponent(id)}`);
}

async function authed<T>(path: string, init: RequestInit = {}): Promise<T> {
  const current = session ?? (await login());
  try {
    return await send<T>(path, init, current.token);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    session = null;
    const renewed = await login();
    return send<T>(path, init, renewed.token);
  }
}

async function send<T>(path: string, init: RequestInit, token?: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(0, "config_error", "VITE_API_BASE_URL is not set");
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch (error) {
    // CORS refusals and unreachable hosts both end up here.
    throw new ApiError(0, "network_error", describe(error));
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const code = body?.error?.code ?? "http_error";
    const message = body?.error?.message ?? `HTTP ${response.status}`;
    throw new ApiError(response.status, code, message);
  }
  return body as T;
}

function describe(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) return JSON.stringify(error);
  return String(error);
}
