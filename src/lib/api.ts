/**
 * Real backend HTTP client.
 * All calls go through the `api-proxy` edge function so cookies + CORS work
 * from both preview and production builds.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const API_BASE = `${SUPABASE_URL}/functions/v1/api-proxy`;

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "ApiError";
  }
}

type RequestOpts = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** When true, return raw Response (e.g. for multipart). */
  raw?: boolean;
  /** Disable automatic refresh on 401. */
  noRefresh?: boolean;
};

async function refreshOnce(): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function api<T = unknown>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { method = "GET", body, query, raw, noRefresh } = opts;
  const qs = query
    ? "?" +
      Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";

  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;
  if (body !== undefined) {
    if (body instanceof FormData) {
      payload = body;
    } else {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }

  const doFetch = () =>
    fetch(`${API_BASE}${path}${qs}`, {
      method,
      credentials: "include",
      headers,
      body: payload,
    });

  let res = await doFetch();
  if (res.status === 401 && !noRefresh && path !== "/auth/login" && path !== "/auth/refresh") {
    const ok = await refreshOnce();
    if (ok) res = await doFetch();
  }

  if (raw) return res as unknown as T;

  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }

  if (!res.ok) {
    const msg = json?.error?.message ?? json?.message ?? `${res.status} ${res.statusText}`;
    const code = json?.error?.code;
    throw new ApiError(res.status, msg, code);
  }
  // Many endpoints wrap in { success, data }
  if (json && typeof json === "object" && "data" in json && Object.keys(json).every((k) => ["data", "success", "meta", "message"].includes(k))) {
    return json.data as T;
  }
  return json as T;
}
