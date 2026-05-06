// Tiny mock HTTP layer. Simulates network latency, JSON responses, and the
// occasional transient error so UI loading/error states are exercised.
// The signature mirrors `fetch` so swapping to a real backend is mechanical.

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

const MIN_LATENCY = 180;
const MAX_LATENCY = 520;
// Probability of a simulated transient 500. Keep low.
const FAULT_RATE = 0.0;

function delay() {
  const ms = MIN_LATENCY + Math.random() * (MAX_LATENCY - MIN_LATENCY);
  return new Promise((r) => setTimeout(r, ms));
}

export async function request<T>(
  method: HttpMethod,
  path: string,
  handler: () => T | Promise<T>,
): Promise<T> {
  await delay();
  if (Math.random() < FAULT_RATE) {
    throw new ApiError(500, `Upstream failure on ${method} ${path}`);
  }
  try {
    const result = await handler();
    return structuredClone(result);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, (err as Error).message);
  }
}

export function notFound(resource: string): never {
  throw new ApiError(404, `${resource} not found`);
}
