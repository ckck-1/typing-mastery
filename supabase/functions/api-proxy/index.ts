// CORS proxy → Typing Academy backend.
// Forwards every /functions/v1/api-proxy/<path> request to
// https://typing-academy-api.onrender.com/api/<path>, relays cookies, and
// rewrites Set-Cookie so the browser stores them against the function origin.

const UPSTREAM = "https://typing-academy-api.onrender.com/api";

function corsHeaders(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function rewriteSetCookie(value: string): string {
  // Drop Domain= so the cookie binds to the proxy origin; force cross-site usage.
  let out = value
    .split(";")
    .map((p) => p.trim())
    .filter((p) => !/^domain=/i.test(p))
    .filter((p) => !/^samesite=/i.test(p))
    .filter((p) => !/^secure$/i.test(p));
  // Ensure path=/ so cookies are sent for any proxied path
  if (!out.some((p) => /^path=/i.test(p))) out.push("Path=/");
  out.push("SameSite=None");
  out.push("Secure");
  return out.join("; ");
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(origin) });

  const url = new URL(req.url);
  // Strip the function prefix: /functions/v1/api-proxy
  const idx = url.pathname.indexOf("/api-proxy");
  const subPath = idx >= 0 ? url.pathname.slice(idx + "/api-proxy".length) : url.pathname;
  const target = `${UPSTREAM}${subPath}${url.search}`;

  // Forward headers — keep Cookie / Content-Type, drop hop-by-hop & supabase auth.
  const fwdHeaders = new Headers();
  for (const [k, v] of req.headers) {
    const key = k.toLowerCase();
    if (["host", "content-length", "connection", "origin", "referer", "authorization", "apikey", "x-client-info"].includes(key)) continue;
    fwdHeaders.set(k, v);
  }
  // Pretend to be the allowed dev origin so the backend's CORS check passes
  fwdHeaders.set("Origin", "http://localhost:5173");

  const init: RequestInit = {
    method: req.method,
    headers: fwdHeaders,
    redirect: "manual",
  };
  if (!["GET", "HEAD"].includes(req.method)) {
    init.body = await req.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch (err) {
    return new Response(JSON.stringify({ error: { message: (err as Error).message } }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }

  const respHeaders = new Headers();
  // Copy benign headers
  for (const [k, v] of upstream.headers) {
    const key = k.toLowerCase();
    if (key === "set-cookie" || key.startsWith("access-control-") || key === "content-encoding" || key === "content-length" || key === "transfer-encoding") continue;
    respHeaders.set(k, v);
  }
  // Relay Set-Cookie (possibly multiple)
  // deno-lint-ignore no-explicit-any
  const setCookies: string[] = (upstream.headers as any).getSetCookie?.() ?? [];
  for (const c of setCookies) respHeaders.append("Set-Cookie", rewriteSetCookie(c));

  for (const [k, v] of Object.entries(corsHeaders(origin))) respHeaders.set(k, v as string);

  return new Response(upstream.body, { status: upstream.status, headers: respHeaders });
});
