import "server-only";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { defaultSettings, type Inquiry, type Product, type ProductDetails, type Settings } from "./products";
import seedPageData from "./pages.json";
import type { Page } from "./pagetypes";
import { seedMaxId, seedProducts } from "./seed";

/**
 * Data store: one JSON document (products, orders, settings, admin password hash) plus uploaded photos.
 *
 * Three backends, picked automatically:
 *  - "redis": Upstash Redis over REST (Vercel → Storage → Upstash Redis sets UPSTASH_REDIS_REST_URL/TOKEN or
 *             KV_REST_API_URL/TOKEN). Persistent and works on serverless hosts.
 *  - "file":  data/db.json on a persistent disk (VPS, Docker volume…). Set DATA_DIR to move it.
 *  - "temp":  serverless host (Vercel) without Redis: the disk is read-only except os.tmpdir(), so the store lives
 *             there. The admin works for demos, but changes may be lost on a cold start — the admin shows a warning.
 */

export type PageEdit = { title?: string; html?: string; hidden?: boolean; updated: string };

export type Db = {
  version: 1;
  /** HMAC secret for the admin session cookie */
  secret: string;
  admin: { salt: string; hash: string };
  /** products created in the admin (the 770 catalogue items are a static seed, see seed.ts) */
  created: Product[];
  /** admin changes on top of a seed product: price, availability, texts … keyed by product id */
  overrides: Record<string, Partial<Product>>;
  /** quotes, service and build requests, back-in-stock requests, messages */
  inquiries: Inquiry[];
  /** long texts of products edited in the admin (the others come from the seed) */
  details?: Record<string, ProductDetails>;
  /** admin changes of pages and articles, keyed by page id */
  edits?: Record<string, PageEdit>;
  settings: Settings;
  counters: { product: number; inquiry: number };
  /** product opens per Budapest day: clicks["2026-10-07"]["939"] = 12 (file / temp storage; Redis keeps them in a hash) */
  clicks?: Record<string, Record<string, number>>;
};

export type StorageKind = "redis" | "file" | "temp";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

export const storageKind: StorageKind = REDIS_URL && REDIS_TOKEN ? "redis" : process.env.VERCEL && !process.env.DATA_DIR ? "temp" : "file";

const DATA_DIR = process.env.DATA_DIR ?? (storageKind === "temp" ? path.join(os.tmpdir(), "sportgravir-data") : path.join(process.cwd(), "data"));
const DB_FILE = path.join(DATA_DIR, "db.json");
const REDIS_KEY = "sportgravir:db";
const REDIS_LOCK = "sportgravir:lock";
const REDIS_CLICKS = "sportgravir:clicks";

type Shared = { cache?: { mtime: number; db: Db }; queue?: Promise<unknown> };
const g = globalThis as typeof globalThis & { __sportgravirStore?: Shared };
const shared: Shared = (g.__sportgravirStore ??= {});

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  return { salt, hash: scryptSync(password, salt, 64).toString("hex") };
}

export function verifyPassword(password: string, admin: Db["admin"]) {
  const a = Buffer.from(scryptSync(password, admin.salt, 64).toString("hex"));
  const b = Buffer.from(admin.hash);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** First-run password. Override with ADMIN_PASSWORD; change it in the admin window afterwards. */
export const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "sportgravir2026";

function freshDb(): Db {
  // On a "temp" store every serverless instance seeds its own copy, so the session secret must not be random,
  // otherwise a login on one instance is rejected by the next.
  const secret = process.env.ADMIN_SECRET ?? (storageKind === "temp" ? createHash("sha256").update(`sportgravir-session:${DEFAULT_ADMIN_PASSWORD}`).digest("hex") : randomBytes(32).toString("hex"));
  return {
    version: 1,
    secret,
    admin: hashPassword(DEFAULT_ADMIN_PASSWORD),
    created: [],
    overrides: {},
    inquiries: [],
    settings: structuredClone(defaultSettings),
    counters: { product: seedMaxId(), inquiry: 0 },
  };
}

/** Older documents lack newer fields. */
function normalize(db: Db): Db {
  db.created ??= [];
  db.edits ??= {};
  db.overrides ??= {};
  db.inquiries ??= [];
  db.counters.inquiry ??= 0;
  db.settings.notice ??= defaultSettings.notice;
  return db;
}

/* ---------------- Redis (Upstash REST) ---------------- */

async function redis(cmd: (string | number)[]): Promise<unknown> {
  // no `cache` option on purpose: pages that read the catalogue stay statically generated, route handlers are always fresh
  const res = await fetch(REDIS_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const data = (await res.json().catch(() => ({}))) as { result?: unknown; error?: string };
  if (!res.ok || data.error) throw new Error(`Redis: ${data.error ?? res.statusText}`);
  return data.result;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function redisLoad(): Promise<Db> {
  let raw = (await redis(["GET", REDIS_KEY])) as string | null;
  if (!raw) {
    await redis(["SET", REDIS_KEY, JSON.stringify(freshDb()), "NX"]);
    raw = (await redis(["GET", REDIS_KEY])) as string;
  }
  return normalize(JSON.parse(raw) as Db);
}

async function redisMutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const token = randomBytes(8).toString("hex");
  let locked = false;
  for (let i = 0; i < 50 && !locked; i++) {
    locked = (await redis(["SET", REDIS_LOCK, token, "NX", "PX", 10000])) === "OK";
    if (!locked) await sleep(120);
  }
  if (!locked) throw new Error("A tároló éppen foglalt, próbálja újra.");
  try {
    const db = await redisLoad();
    const result = await fn(db);
    await redis(["SET", REDIS_KEY, JSON.stringify(db)]);
    return result;
  } finally {
    await redis(["EVAL", "if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end", 1, REDIS_LOCK, token]).catch(() => undefined);
  }
}

/* ---------------- file / temp ---------------- */

async function createIfMissing() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_FILE);
    return;
  } catch {
    // fall through and create
  }
  const tmp = path.join(DATA_DIR, `.seed-${process.pid}-${randomBytes(4).toString("hex")}.json`);
  await fs.writeFile(tmp, JSON.stringify(freshDb(), null, 2));
  try {
    await fs.link(tmp, DB_FILE); // atomic and fails if another worker got there first
  } catch {
    // someone else created it — or the file system has no hard links: then fall back to a plain rename
    const exists = await fs.access(DB_FILE).then(() => true, () => false);
    if (!exists) await fs.rename(tmp, DB_FILE).catch(() => undefined);
  } finally {
    await fs.unlink(tmp).catch(() => undefined);
  }
}

async function fileLoad(): Promise<Db> {
  await createIfMissing();
  const stat = await fs.stat(DB_FILE);
  const mtime = stat.mtimeMs;
  if (shared.cache && shared.cache.mtime === mtime) return shared.cache.db;
  const db = normalize(JSON.parse(await fs.readFile(DB_FILE, "utf8")) as Db);
  shared.cache = { mtime, db };
  return db;
}

function fileMutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = async () => {
    await createIfMissing();
    const db = normalize(JSON.parse(await fs.readFile(DB_FILE, "utf8")) as Db);
    const result = await fn(db);
    const tmp = `${DB_FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2));
    await fs.rename(tmp, DB_FILE);
    const stat = await fs.stat(DB_FILE);
    shared.cache = { mtime: stat.mtimeMs, db };
    return result;
  };
  const next = (shared.queue ?? Promise.resolve()).then(run, run);
  shared.queue = next.catch(() => undefined);
  return next;
}

/* ---------------- public API ---------------- */

export const readDb = (): Promise<Db> => (storageKind === "redis" ? redisLoad() : fileLoad());

/** Run a change against the freshest data and persist it. Calls never interleave. */
export const mutate = <T>(fn: (db: Db) => T | Promise<T>): Promise<T> => (storageKind === "redis" ? redisMutate(fn) : fileMutate(fn));

/** Uploaded product photos: Redis (base64) on serverless hosts, otherwise a folder next to the data file. */
export async function saveUpload(name: string, data: Buffer) {
  if (storageKind === "redis") {
    await redis(["SET", `sportgravir:img:${name}`, data.toString("base64")]);
    return;
  }
  await fs.mkdir(path.join(DATA_DIR, "uploads"), { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, "uploads", name), data);
}

export async function readUpload(name: string): Promise<Buffer | null> {
  try {
    if (storageKind === "redis") {
      const b64 = (await redis(["GET", `sportgravir:img:${name}`])) as string | null;
      return b64 ? Buffer.from(b64, "base64") : null;
    }
    return await fs.readFile(path.join(DATA_DIR, "uploads", name));
  } catch {
    return null;
  }
}

/* ---------------- products ---------------- */

const merged = new WeakMap<Db, Product[]>();
const indexes = new WeakMap<Product[], { byId: Map<number, Product>; bySlug: Map<string, Product> }>();

/** The static seed with the admin's changes on top, plus the products created in the admin. Cached per document. */
function mergeProducts(db: Db): Product[] {
  let list = merged.get(db);
  if (list) return list;
  const seed = seedProducts();
  const ov = db.overrides;
  const hasOv = Object.keys(ov).length > 0;
  const base = hasOv ? seed.map((p) => (ov[p.id] ? { ...p, ...ov[p.id], custom: true } : p)) : seed;
  list = db.created.length ? [...base, ...db.created.map((p) => ({ ...p, custom: true }))] : base;
  list = [...list].sort((a, b) => a.position - b.position || a.id - b.id);
  merged.set(db, list);
  return list;
}

function indexOf(list: Product[]) {
  let ix = indexes.get(list);
  if (!ix) {
    ix = { byId: new Map(list.map((p) => [p.id, p])), bySlug: new Map(list.map((p) => [p.slug, p])) };
    indexes.set(list, ix);
  }
  return ix;
}

export async function getAllProducts(): Promise<Product[]> {
  return mergeProducts(await readDb());
}

export async function getVisibleProducts(): Promise<Product[]> {
  return (await getAllProducts()).filter((p) => p.visible);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return indexOf(await getAllProducts()).bySlug.get(slug);
}

export async function getProductById(id: number): Promise<Product | undefined> {
  return indexOf(await getAllProducts()).byId.get(id);
}

/** Inside a mutation: all products with the changes of this (fresh) document. */
export const productsIn = (db: Db): Product[] => mergeProducts(db);

/** Inside a mutation: the product with its changes (db is the fresh document). */
export function productIn(db: Db, id: number): Product | undefined {
  return indexOf(mergeProducts(db)).byId.get(id);
}

/** Inside a mutation: store a changed product — an override for a seed item, the product itself for one created in the admin. */
export function saveProduct(db: Db, next: Product) {
  const created = db.created.findIndex((p) => p.id === next.id);
  if (created >= 0) db.created[created] = next;
  else db.overrides[String(next.id)] = next;
  merged.delete(db);
}

export function removeProduct(db: Db, id: number) {
  const created = db.created.findIndex((p) => p.id === id);
  if (created >= 0) db.created.splice(created, 1);
  else db.overrides[String(id)] = { ...(db.overrides[String(id)] ?? {}), visible: false };
  merged.delete(db);
}

export function addProduct(db: Db, p: Product) {
  db.created.push(p);
  merged.delete(db);
}

/** Description and technical table of a product: the admin's edited copy if there is one, otherwise the seed. */
export async function getDetails(id: number): Promise<ProductDetails> {
  const db = await readDb();
  const own = db.details?.[String(id)];
  if (own) return own;
  const seed = (await import("./details.json")).default as unknown as Record<string, ProductDetails>;
  return seed[String(id)] ?? {};
}

export async function getSettings(): Promise<Settings> {
  return (await readDb()).settings;
}

/* ---------------- product clicks ---------------- */

/** Calendar day in Budapest as YYYY-MM-DD (the owner thinks in local days, a serverless host runs on UTC). */
export const budapestDay = (d = new Date()) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Budapest" }).format(d);

/** Count one product open. Redis uses an atomic HINCRBY (no lock, no rewrite of the whole document). */
export async function recordClick(productId: number) {
  const day = budapestDay();
  if (storageKind === "redis") {
    await redis(["HINCRBY", REDIS_CLICKS, `${day}:${productId}`, 1]);
    return;
  }
  await mutate((db) => {
    const row = ((db.clicks ??= {})[day] ??= {});
    row[productId] = (row[productId] ?? 0) + 1;
  });
}

/** All counters as clicks[day][productId]. */
export async function getClicks(): Promise<Record<string, Record<string, number>>> {
  if (storageKind === "redis") {
    const flat = ((await redis(["HGETALL", REDIS_CLICKS])) as string[] | null) ?? [];
    const out: Record<string, Record<string, number>> = {};
    for (let i = 0; i + 1 < flat.length; i += 2) {
      const [day, id] = flat[i].split(":");
      (out[day] ??= {})[id] = Number(flat[i + 1]) || 0;
    }
    return out;
  }
  return (await readDb()).clicks ?? {};
}


/* ---------------- pages ---------------- */

const seedPages = seedPageData as unknown as Page[];
const mergedPages = new WeakMap<Db, Page[]>();

function mergePages(db: Db): Page[] {
  let list = mergedPages.get(db);
  if (list) return list;
  const edits = db.edits ?? {};
  list = seedPages.map((p) => {
    const e = edits[String(p.id)];
    return e ? { ...p, title: e.title ?? p.title, html: e.html ?? p.html, hidden: e.hidden ?? false, custom: true, updated: e.updated } : p;
  });
  mergedPages.set(db, list);
  return list;
}

export async function getAllPages(): Promise<Page[]> {
  return mergePages(await readDb());
}

export async function getPages(): Promise<Page[]> {
  return (await getAllPages()).filter((p) => !p.hidden);
}

export async function getPageByPath(path: string): Promise<Page | undefined> {
  return (await getPages()).find((p) => p.path === path);
}

export async function getPageById(id: number): Promise<Page | undefined> {
  return (await getAllPages()).find((p) => p.id === id);
}

/** Inside a mutation: the page with its changes. */
export const pageIn = (db: Db, id: number): Page | undefined => mergePages(db).find((p) => p.id === id);

export function savePage(db: Db, id: number, edit: Omit<PageEdit, "updated">) {
  (db.edits ??= {})[String(id)] = { ...edit, updated: new Date().toISOString() };
  mergedPages.delete(db);
}

export function resetPage(db: Db, id: number) {
  delete (db.edits ??= {})[String(id)];
  mergedPages.delete(db);
}
