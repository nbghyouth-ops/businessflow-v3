import { createServer, type Server } from "node:http";
import { randomUUID } from "node:crypto";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

export type MockUser = { sub: string; email: string; email_verified: boolean; name: string; picture?: string };

/** Penyedia OIDC lokal deterministik (HANYA untuk uji; tidak pernah diimpor oleh src/). */
export async function startMockOidc(clientId: string, clientSecret: string) {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256", use: "sig" };
  const codes = new Map<string, { user: MockUser; used: boolean; nonce: string | null }>();
  let override: { aud?: string; iss?: string; exp?: string | number; nonce?: string } = {};
  const tokens = new Map<string, MockUser>();
  let current: MockUser = { sub: "g-1", email: "a@example.test", email_verified: true, name: "User A" };
  let issuer = "";

  const server: Server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", issuer);
    const json = (o: unknown, code = 200) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };
    if (url.pathname === "/.well-known/openid-configuration") {
      return json({
        issuer, authorization_endpoint: `${issuer}/authorize`, token_endpoint: `${issuer}/token`,
        userinfo_endpoint: `${issuer}/userinfo`, jwks_uri: `${issuer}/jwks`,
        response_types_supported: ["code"], subject_types_supported: ["public"], id_token_signing_alg_values_supported: ["RS256"],
      });
    }
    if (url.pathname === "/jwks") return json({ keys: [jwk] });
    if (url.pathname === "/authorize") {
      const code = randomUUID();
      codes.set(code, { user: current, used: false, nonce: url.searchParams.get("nonce") });
      const back = new URL(url.searchParams.get("redirect_uri")!);
      back.searchParams.set("code", code);
      back.searchParams.set("state", url.searchParams.get("state") ?? "");
      res.writeHead(302, { location: back.toString() });
      return res.end();
    }
    if (url.pathname === "/token" && req.method === "POST") {
      const body = await new Promise<string>((r) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => r(b)); });
      const p = new URLSearchParams(body);
      const entry = codes.get(p.get("code") ?? "");
      if (!entry || entry.used) return json({ error: "invalid_grant" }, 400);
      entry.used = true; // kode sekali pakai
      const u = entry.user;
      const idToken = await new SignJWT({ nonce: override.nonce ?? entry.nonce ?? undefined, email: u.email, email_verified: u.email_verified, name: u.name, picture: u.picture })
        .setProtectedHeader({ alg: "RS256", kid: "k1" }).setIssuer(override.iss ?? issuer).setAudience(override.aud ?? clientId).setSubject(u.sub)
        .setIssuedAt().setExpirationTime(override.exp ?? "10m").sign(privateKey);
      const access = randomUUID();
      tokens.set(access, u);
      return json({ access_token: access, token_type: "Bearer", expires_in: 3600, id_token: idToken, scope: "openid email profile" });
    }
    if (url.pathname === "/userinfo") {
      const t = (req.headers.authorization ?? "").replace(/^Bearer /, "");
      const u = tokens.get(t);
      if (!u) return json({ error: "invalid_token" }, 401);
      return json({ sub: u.sub, email: u.email, email_verified: u.email_verified, name: u.name, picture: u.picture });
    }
    json({ error: "not_found" }, 404);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const port = (server.address() as { port: number }).port;
  issuer = `http://127.0.0.1:${port}`;
  return {
    issuer,
    discoveryUrl: `${issuer}/.well-known/openid-configuration`,
    clientId, clientSecret,
    setUser(u: Partial<MockUser>) { current = { ...current, ...u }; },
    setOverride(o: typeof override) { override = o; },
    close: () => new Promise<void>((r) => server.close(() => r())),
  };
}
