import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { readDb } from "./store";

export const SESSION_COOKIE = "sportgravir_admin";
/** Readable marker so the public site only asks "am I admin?" for browsers that have logged in. */
export const HINT_COOKIE = "sportgravir_admin_hint";
const TTL_MS = 14 * 24 * 60 * 60 * 1000;

const sign = (secret: string, exp: number) => createHmac("sha256", secret).update(`admin.${exp}`).digest("hex");

export async function createSessionToken() {
  const { secret } = await readDb();
  const exp = Date.now() + TTL_MS;
  return `${exp}.${sign(secret, exp)}`;
}

function cookieFrom(req: Request, name: string) {
  const header = req.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

export async function isAdmin(req: Request) {
  const token = cookieFrom(req, SESSION_COOKIE);
  if (!token) return false;
  const [expRaw, mac] = token.split(".");
  const exp = Number(expRaw);
  if (!exp || !mac || exp < Date.now()) return false;
  const { secret } = await readDb();
  const expected = Buffer.from(sign(secret, exp));
  const given = Buffer.from(mac);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function cookieHeaders(token: string | null) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  if (!token) {
    return [`${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`, `${HINT_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0${secure}`];
  }
  const age = Math.floor(TTL_MS / 1000);
  return [`${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure}`, `${HINT_COOKIE}=1; Path=/; SameSite=Lax; Max-Age=${age}${secure}`];
}

/* ---------------- request helpers ---------------- */

export function json(data: unknown, init: { status?: number; headers?: [string, string][] } = {}) {
  const headers = new Headers({ "Cache-Control": "no-store" });
  init.headers?.forEach(([k, v]) => headers.append(k, v));
  return Response.json(data, { status: init.status ?? 200, headers });
}

export const fail = (message: string, status = 400) => json({ error: message }, { status });

/** Mutating requests must come from this site (blocks cross-site form posts even though the cookie is SameSite=Lax). */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients and same-origin GETs
  try {
    return new URL(origin).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  } catch {
    return false;
  }
}

/** Returns an error Response when the caller is not an authenticated admin, otherwise null. */
export async function guardAdmin(req: Request, mutating = false) {
  if (mutating && !sameOrigin(req)) return fail("Érvénytelen kérés.", 403);
  if (!(await isAdmin(req))) return fail("Nincs jogosultság.", 401);
  return null;
}

/* ---------------- tiny in-memory rate limiter ---------------- */

type Bucket = { n: number; reset: number };
const g = globalThis as typeof globalThis & { __sportgravirRate?: Map<string, Bucket> };
const buckets = (g.__sportgravirRate ??= new Map<string, Bucket>());

export function rateLimited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return false;
  }
  b.n += 1;
  return b.n > max;
}

export const clientIp = (req: Request) => (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
