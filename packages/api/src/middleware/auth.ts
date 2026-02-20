import { createMiddleware } from "hono/factory";
import type { Bindings, Variables } from "../types.js";

/** API key auth middleware — checks Authorization: Bearer <key> */
export const apiKeyAuth = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header) {
    return c.json({ error: "Missing Authorization header" }, 401);
  }

  const [scheme, key] = header.split(" ", 2);
  if (scheme !== "Bearer" || !key) {
    return c.json({ error: "Authorization must use Bearer scheme" }, 401);
  }

  // Constant-time comparison to prevent timing attacks
  const encoder = new TextEncoder();
  const a = encoder.encode(key);
  const b = encoder.encode(c.env.API_KEY);
  if (a.byteLength !== b.byteLength) {
    return c.json({ error: "Invalid API key" }, 403);
  }
  let mismatch = 0;
  for (let i = 0; i < a.byteLength; i++) {
    mismatch |= a[i] ^ b[i];
  }
  if (mismatch !== 0) {
    return c.json({ error: "Invalid API key" }, 403);
  }

  await next();
});

/** Verify GitHub HMAC-SHA256 webhook signature */
export async function verifyGitHubSignature(
  secret: string,
  payload: string,
  signature: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expected = "sha256=" + Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  const a = encoder.encode(expected);
  const b = encoder.encode(signature);
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}
