/**
 * mock/transport.ts
 *
 * Simulated HTTP transport layer.
 * Returns typed ApiResponse<T> objects that mirror real REST API responses
 * (status codes, headers, pagination metadata).
 * All calls go through here so the app exercises real loading / error states.
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiResponse<T> = {
  data: T;
  status: number;
  ok: true;
  meta?: PaginationMeta;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, message: string, code = "UNKNOWN_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "ApiError";
  }
}

// Latency config — edit to feel faster/slower
const LATENCY = { min: 150, max: 450 };

// Simulated fault injection rate (0 = off, 0.05 = 5% of requests fail)
const FAULT_RATE = 0.0;

function jitter() {
  const ms = LATENCY.min + Math.random() * (LATENCY.max - LATENCY.min);
  return new Promise<void>((r) => setTimeout(r, ms));
}

/**
 * Execute a mock request with realistic async behaviour.
 * `handler` is a synchronous or async function that returns the response body.
 * Throws ApiError on failure.
 */
export async function request<T>(
  method: HttpMethod,
  path: string,
  handler: () => T | Promise<T>,
  meta?: PaginationMeta,
): Promise<ApiResponse<T>> {
  await jitter();

  if (Math.random() < FAULT_RATE) {
    throw new ApiError(503, `[Mock] Transient fault on ${method} ${path}`, "SERVICE_UNAVAILABLE");
  }

  try {
    const raw = await handler();
    return { data: structuredClone(raw) as T, status: 200, ok: true, meta };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, (err as Error).message, "INTERNAL_ERROR");
  }
}

// ─── Convenience throwers ─────────────────────────────────────────────────────

export function notFound(resource: string): never {
  throw new ApiError(404, `${resource} not found`, "NOT_FOUND");
}

export function unauthorized(msg = "Authentication required"): never {
  throw new ApiError(401, msg, "UNAUTHORIZED");
}

export function forbidden(msg = "Forbidden"): never {
  throw new ApiError(403, msg, "FORBIDDEN");
}

export function conflict(msg: string): never {
  throw new ApiError(409, msg, "CONFLICT");
}

export function validationError(msg: string): never {
  throw new ApiError(422, msg, "VALIDATION_ERROR");
}

// ─── Pagination helper ────────────────────────────────────────────────────────

export type PaginationParams = { page?: number; pageSize?: number };

export function paginate<T>(
  items: T[],
  { page = 1, pageSize = 20 }: PaginationParams,
): { rows: T[]; meta: PaginationMeta } {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const rows = items.slice(start, start + pageSize);
  return { rows, meta: { page: safePage, pageSize, total, totalPages } };
}