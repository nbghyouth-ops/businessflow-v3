import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { genericOAuth } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { authAccounts, authSessions, authUsers } from "@/db/schema";
import { createAuth } from "@/server/auth/factory";
import { startMockOidc } from "../helpers/mock-oidc";

const hasDb = Boolean(process.env.DATABASE_URL?.trim());
const BASE = "http://localhost:3999";
const PID = "oidc-test";

type Jar = Map<string, string>;
const jarHeader = (j: Jar) => [...j].map(([k, v]) => `${k}=${v}`).join("; ");
function absorb(j: Jar, res: Response) {
  for (const c of res.headers.getSetCookie()) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    const k = pair.slice(0, i), v = pair.slice(i + 1);
    if (/max-age=0/i.test(c) || v === "") j.delete(k); else j.set(k, v);
  }
}

describe.skipIf(!hasDb)("Alur OAuth/OIDC penuh → sesi DB (harness lokal)", () => {
  let mock: Awaited<ReturnType<typeof startMockOidc>>;
  let auth: ReturnType<typeof createAuth>;
  const tag = randomUUID().slice(0, 8);

  beforeAll(async () => {
    mock = await startMockOidc("cid", "csecret");
    auth = createAuth({
      baseURL: BASE,
      secret: "x".repeat(40),
      rateLimit: { max: 10_000, window: 60, customRules: { "/sign-in/*": false, "/callback/*": false } }, // harness: longgar; batas produksi diuji terpisah di bawah
      plugins: [genericOAuth({ config: [{ providerId: PID, clientId: mock.clientId, clientSecret: mock.clientSecret, discoveryUrl: mock.discoveryUrl, scopes: ["openid", "email", "profile"], pkce: true }] })],
    });
  });
  afterAll(async () => {
    await mock?.close();
    await db.delete(authUsers).where(eq(authUsers.name, `T-${tag}`));
  });

  async function startLogin(jar: Jar, callbackURL = "/") {
    const res = await auth.handler(new Request(`${BASE}/api/auth/sign-in/social`, {
      method: "POST", headers: { "content-type": "application/json", origin: BASE },
      body: JSON.stringify({ provider: PID, callbackURL }),
    }));
    absorb(jar, res);
    const { url } = (await res.json()) as { url: string };
    return url;
  }
  async function authorize(url: string) {
    const r = await fetch(url, { redirect: "manual" });
    return r.headers.get("location")!;
  }
  async function callback(loc: string, jar: Jar) {
    const res = await auth.handler(new Request(loc, { headers: { cookie: jarHeader(jar) } }));
    absorb(jar, res);
    return res;
  }
  async function login(user: { sub: string; email: string; email_verified?: boolean }, jar: Jar) {
    mock.setUser({ ...user, email_verified: user.email_verified ?? true, name: `T-${tag}` });
    const url = await startLogin(jar);
    const loc = await authorize(url);
    return callback(loc, jar);
  }
  const session = (jar: Jar) => auth.api.getSession({ headers: new Headers({ cookie: jarHeader(jar) }) });

  it("login sukses: sesi tersimpan di DB, cookie HttpOnly SameSite=Lax, getSession valid", async () => {
    const jar: Jar = new Map();
    const res = await login({ sub: `s-${tag}-1`, email: `a-${tag}@example.test` }, jar);
    expect([302, 303]).toContain(res.status);
    const setCookie = res.headers.getSetCookie().join("\n");
    expect(setCookie).toMatch(/session_token/);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);
    const s = await session(jar);
    expect(s?.user.email).toBe(`a-${tag}@example.test`);
    const rows = await db.select().from(authSessions).where(eq(authSessions.userId, s!.user.id));
    expect(rows.length).toBe(1);
  });

  it("token Google TIDAK disimpan di tabel account (hanya provider + sub)", async () => {
    const jar: Jar = new Map();
    await login({ sub: `s-${tag}-tok`, email: `tok-${tag}@example.test` }, jar);
    const [a] = await db.select().from(authAccounts).where(eq(authAccounts.accountId, `s-${tag}-tok`));
    expect(a).toBeTruthy();
    expect(a.accessToken ?? null).toBeNull();
    expect(a.refreshToken ?? null).toBeNull();
    expect(a.idToken ?? null).toBeNull();
  });

  it("kunci identitas = sub: email berubah tetap user yang sama", async () => {
    const jar: Jar = new Map();
    await login({ sub: `s-${tag}-1`, email: `changed-${tag}@example.test` }, jar);
    const s = await session(jar);
    expect(s).toBeTruthy();
    const accts = await db.select().from(authAccounts).where(eq(authAccounts.accountId, `s-${tag}-1`));
    expect(accts.length).toBe(1);
  });

  it("email sama tetapi sub berbeda TIDAK ter-link (tanpa auto-link) dan tidak ada sesi", async () => {
    const jar: Jar = new Map();
    const res = await login({ sub: `s-${tag}-evil`, email: `a-${tag}@example.test` }, jar); // email milik user pertama
    expect(await session(jar)).toBeNull();
    const accts = await db.select().from(authAccounts).where(eq(authAccounts.accountId, `s-${tag}-evil`));
    expect(accts.length).toBe(0);
    expect(res.status).toBeLessThan(400); // redirect ke halaman error callback, bukan 500
  });

  it("email_verified=false ditolak", async () => {
    const jar: Jar = new Map();
    await login({ sub: `s-${tag}-unv`, email: `unv-${tag}@example.test`, email_verified: false }, jar);
    expect(await session(jar)).toBeNull();
    const accts = await db.select().from(authAccounts).where(eq(authAccounts.accountId, `s-${tag}-unv`));
    expect(accts.length).toBe(0);
  });

  it("state salah ditolak", async () => {
    const jar: Jar = new Map();
    mock.setUser({ sub: `s-${tag}-st`, email: `st-${tag}@example.test`, email_verified: true, name: `T-${tag}` });
    const url = await startLogin(jar);
    const loc = new URL(await authorize(url));
    loc.searchParams.set("state", "tampered");
    await callback(loc.toString(), jar);
    expect(await session(jar)).toBeNull();
  });

  it("code yang dipakai ulang ditolak (replay)", async () => {
    const jar: Jar = new Map();
    mock.setUser({ sub: `s-${tag}-rp`, email: `rp-${tag}@example.test`, email_verified: true, name: `T-${tag}` });
    const url = await startLogin(jar);
    const loc = await authorize(url);
    await callback(loc, jar);
    expect(await session(jar)).toBeTruthy();
    const jar2: Jar = new Map(); // sesi baru tanpa state yang sah
    await callback(loc, jar2);
    expect(await session(jar2)).toBeNull();
  });

  it("sesi dicabut di DB ⇒ getSession null seketika; user dinonaktifkan ⇒ login ditolak", async () => {
    const jar: Jar = new Map();
    await login({ sub: `s-${tag}-rv`, email: `rv-${tag}@example.test` }, jar);
    const s = await session(jar);
    expect(s).toBeTruthy();
    await db.delete(authSessions).where(eq(authSessions.userId, s!.user.id));
    expect(await session(jar)).toBeNull();
    await db.update(authUsers).set({ status: "disabled" }).where(eq(authUsers.id, s!.user.id));
    const jar2: Jar = new Map();
    await login({ sub: `s-${tag}-rv`, email: `rv-${tag}@example.test` }, jar2);
    expect(await session(jar2)).toBeNull();
  });

  for (const [name, ov] of [
    ["aud salah", { aud: "client-lain" }],
    ["iss salah", { iss: "https://evil.example" }],
    ["token kedaluwarsa", { exp: Math.floor(Date.now() / 1000) - 3600 }],
    ["nonce salah", { nonce: "nonce-palsu" }],
  ] as const) {
    it(`id_token dengan ${name} ditolak`, async () => {
      const jar: Jar = new Map();
      mock.setOverride(ov);
      try {
        await login({ sub: `s-${tag}-${name.replace(/\W/g, "")}`, email: `x-${name.replace(/\W/g, "")}-${tag}@example.test` }, jar);
      } finally {
        mock.setOverride({});
      }
      expect(await session(jar)).toBeNull();
    });
  }

  it("email/password dinonaktifkan", async () => {
    const res = await auth.handler(new Request(`${BASE}/api/auth/sign-in/email`, {
      method: "POST", headers: { "content-type": "application/json", origin: BASE },
      body: JSON.stringify({ email: "a@b.c", password: "password123" }),
    }));
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe.skipIf(!hasDb)("Rate limit login lintas instance (tabel DB)", () => {
  it("lebih dari batas per IP ⇒ 429, dan hitungan tersimpan di DB (bukan memori)", async () => {
    const limited = createAuth({ baseURL: BASE, secret: "y".repeat(40), rateLimit: { max: 3, window: 60 },
      plugins: [genericOAuth({ config: [{ providerId: PID, clientId: "c", clientSecret: "s", discoveryUrl: "http://127.0.0.1:9/.well-known/openid-configuration" }] })] });
    const ip = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
    const hit = () => limited.handler(new Request(`${BASE}/api/auth/sign-in/email`, {
      method: "POST", headers: { "content-type": "application/json", origin: BASE, "x-forwarded-for": ip }, body: "{}",
    }));
    const codes: number[] = [];
    for (let i = 0; i < 6; i++) codes.push((await hit()).status);
    expect(codes.includes(429)).toBe(true);
    const { rows } = await db.execute(`SELECT count(*)::int AS n FROM auth_rate_limits WHERE key LIKE '%${ip}%'` as never) as unknown as { rows: { n: number }[] };
    expect(rows[0].n).toBeGreaterThan(0);
  });
});
