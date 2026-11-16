// Integration smoke test terhadap server yang berjalan (BASE_URL, default http://localhost:3111).
// Hanya memakai database LOKAL yang dikonfigurasi server. Tidak menyentuh Neon production.
const BASE = process.env.BASE_URL || "http://localhost:3111";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("PASS", m); } else { fail++; console.log("FAIL", m); } };

import { createHash, createHmac, randomUUID } from "node:crypto";
import pg from "pg";

// Sesi uji: baris user+session dimasukkan langsung ke DB LOKAL dan cookie ditandatangani dengan BETTER_AUTH_SECRET
// yang sama dengan server (sama persis dengan format cookie Better Auth). Alur OAuth penuh diuji di tests/integration/auth-flow.test.ts.
const SECRET = process.env.BETTER_AUTH_SECRET;
if (!SECRET || !process.env.DATABASE_URL) { console.error("Set DATABASE_URL dan BETTER_AUTH_SECRET sama dengan server uji."); process.exit(2); }
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
// Smoke dapat diulang: kosongkan rate limit DB lokal.
await pool.query("DELETE FROM api_rate_limits");
async function makeUser(label) {
  const id = randomUUID(), token = randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "").slice(0, 8);
  await pool.query(`INSERT INTO "user" (id,name,email,email_verified) VALUES ($1,$2,$3,true)`, [id, `Smoke ${label}`, `smoke-${label}-${id.slice(0, 8)}@example.test`]);
  await pool.query(`INSERT INTO session (id,expires_at,token,user_id) VALUES ($1, now() + interval '1 day', $2, $3)`, [randomUUID(), token, id]);
  const sig = createHmac("sha256", SECRET).update(token).digest("base64");
  return { id, token, cookie: `better-auth.session_token=${encodeURIComponent(`${token}.${sig}`)}` };
}

class Client {
  constructor() { this.cookie = ""; this.tab = null; this.user = ""; }
  async call(method, path, body, extra = {}) {
    const headers = { "x-requested-with": "bf", "content-type": "application/json", ...extra };
    const ck = [this.user, this.cookie].filter(Boolean).join("; ");
    if (ck) headers.cookie = ck;
    if (this.tab && !extra["x-tab-session"] && extra["x-tab-session"] !== null) headers["x-tab-session"] = this.tab;
    const res = await fetch(BASE + "/api/v1" + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const sc = res.headers.get("set-cookie");
    if (sc) this.cookie = sc.split(";")[0];
    let data = null; try { data = await res.json(); } catch {}
    return { status: res.status, data };
  }
}

const owner = new Client();
const ownerUser = await makeUser("owner");
// Onboarding tanpa sesi Google harus ditolak
{
  const anon = new Client();
  const rr = await anon.call("POST", "/onboarding/pin", { pin: "4827", confirm: "4827" });
  ok(rr.status === 401 && rr.data?.code === "auth_required", "Onboarding tanpa login Google ditolak (401 auth_required)");
}
owner.user = ownerUser.cookie;
const draft = {
  needs: ["finance", "pos"], problems: [], solutions: [], templateKey: "retail", businessModel: "B2C",
  name: "Toko Uji Coba " + Date.now(), ownerName: "Pemilik Uji", deviceName: "Laptop Uji",
  timezone: "Asia/Jakarta", language: "id", dateFormat: "DD/MM/YYYY", currency: "IDR",
  cashAccounts: [{ name: "Kas Utama", kind: "cash", openingBalance: "1000000" }, { name: "Bank BCA", kind: "bank", openingBalance: "" }],
  incomeCategories: ["Pendapatan Penjualan", "Pendapatan Lain"], expenseCategories: ["Beban Operasional", "Beban Sewa"],
  fiscalStartMonth: 1, mainBranchName: "Pusat", extraBranches: [], modules: [], mode: "simple", acceptTerms: true, acceptPrivacy: true,
};

// ── Onboarding & PIN
let r = await owner.call("POST", "/onboarding/pin", { pin: "1234", confirm: "1234" });
ok(r.status === 422, "PIN lemah (1234) ditolak");
r = await owner.call("POST", "/onboarding/pin", { pin: "4827", confirm: "4828" });
ok(r.status === 422, "Konfirmasi PIN tidak sama ditolak");
r = await owner.call("POST", "/onboarding/pin", { pin: "4827", confirm: "4827" });
ok(r.status === 200 || r.status === 201, "PIN valid dibuat (cookie device diterbitkan)");
ok(owner.cookie.startsWith("bf_device="), "Cookie device diterima");
r = await owner.call("POST", "/onboarding/draft", { step: 3, data: { name: "x" } });
ok(r.status === 200 || r.status === 201, "Draft onboarding tersimpan");
r = await owner.call("GET", "/onboarding/draft");
ok(r.data?.step === 3, "Draft dapat dilanjutkan");
r = await owner.call("POST", "/onboarding/complete", { ...draft, acceptTerms: false });
ok(r.status === 422, "Onboarding tanpa persetujuan syarat ditolak");
r = await owner.call("POST", "/onboarding/complete", draft);
ok(r.status === 201 || r.status === 200, "Workspace dibuat: " + JSON.stringify(r.data).slice(0, 80));

// ── Lock / unlock
r = await owner.call("GET", "/dashboard");
ok(r.status === 401 && r.data?.code === "locked", "API menolak tanpa sesi tab (terkunci)");
r = await owner.call("POST", "/device/unlock", { pin: "0000" });
ok(r.status === 401, "PIN salah ditolak");
r = await owner.call("POST", "/device/unlock", { pin: "4827" });
ok(r.status === 200 && r.data.tab, "Unlock berhasil");
owner.tab = r.data.tab;
const tabA = owner.tab;
r = await owner.call("POST", "/device/unlock", { pin: "4827" });
const tabB = r.data.tab;
await owner.call("POST", "/device/lock", null, { "x-tab-session": tabA });
r = await owner.call("GET", "/dashboard", null, { "x-tab-session": tabA });
ok(r.status === 401, "Tab A terkunci setelah lock; sesi dicabut di server");
r = await owner.call("GET", "/dashboard", null, { "x-tab-session": tabB });
ok(r.status === 200, "Tab B tetap punya sesi sendiri (isolasi per-tab)");
owner.tab = tabB;
r = await owner.call("POST", "/device/unlock", { pin: "1234" }, { "x-requested-with": "other" });
ok(r.status === 403, "CSRF: header x-requested-with salah ditolak");

// ── Keuangan
const accs = (await owner.call("GET", "/finance/cash-accounts")).data.items;
const kas = accs.find((a) => a.name === "Kas Utama"), bank = accs.find((a) => a.name === "Bank BCA");
ok(kas.balance === "1000000.00", "Saldo awal Kas Utama dari jurnal = 1.000.000");
const cats = (await owner.call("GET", "/finance/categories")).data.items;
const inc = cats.find((c) => c.kind === "income"), exp = cats.find((c) => c.kind === "expense");
const idem = "idem-" + Date.now();
const t1 = await owner.call("POST", "/finance/transactions", { type: "income", amount: "2500000", categoryId: inc.id, accountId: kas.id }, { "idempotency-key": idem });
const t1b = await owner.call("POST", "/finance/transactions", { type: "income", amount: "2500000", categoryId: inc.id, accountId: kas.id }, { "idempotency-key": idem });
ok(t1.status === 201 && t1b.data.id === t1.data.id, "Idempotency: retry tidak membuat transaksi ganda");
const t2 = await owner.call("POST", "/finance/transactions", { type: "expense", amount: "350000", categoryId: exp.id, accountId: kas.id });
ok(t2.data.state === "posted", "Expense diposting");
r = await owner.call("POST", "/finance/transactions", { type: "transfer", amount: "1000000", accountId: kas.id, toAccountId: kas.id });
ok(r.status === 422, "Transfer akun sama ditolak");
r = await owner.call("POST", "/finance/transactions", { type: "transfer", amount: "1000000", accountId: kas.id, toAccountId: bank.id });
ok(r.status === 201, "Transfer Kas→Bank");
r = await owner.call("POST", "/finance/transactions", { type: "income", amount: "0", categoryId: inc.id, accountId: kas.id });
ok(r.status === 422, "Nominal nol ditolak");
r = await owner.call("POST", "/finance/transactions", { type: "income", amount: "10.5", categoryId: inc.id, accountId: kas.id });
ok(r.status === 422, "IDR tidak menerima pecahan");
r = await owner.call("POST", "/finance/transactions", { type: "income", amount: "100", categoryId: exp.id, accountId: kas.id });
ok(r.status === 422, "Kategori expense untuk income ditolak");
let accs2 = (await owner.call("GET", "/finance/cash-accounts")).data.items;
ok(accs2.find((a) => a.name === "Kas Utama").balance === "2150000.00", "Kas = 1.000.000 + 2.500.000 - 350.000 - 1.000.000 = 2.150.000: " + accs2.find((a) => a.name === "Kas Utama").balance);
ok(accs2.find((a) => a.name === "Bank BCA").balance === "1000000.00", "Bank = 1.000.000 dari transfer");
r = await owner.call("POST", `/finance/transactions/${t2.data.id}/reverse`, { reason: "Salah input" });
ok(r.status === 201 || r.status === 200, "Reversal expense");
r = await owner.call("POST", `/finance/transactions/${t2.data.id}/reverse`, { reason: "Ulang" });
ok(r.status === 409, "Reversal ganda ditolak (state machine)");

// ── Laporan
const tb = await owner.call("GET", "/reports/trial-balance");
const last = tb.data.rows.at(-1);
ok(last.debit === last.credit, "Neraca saldo seimbang: " + last.debit + " = " + last.credit);
const bs = await owner.call("GET", "/reports/balance-sheet");
ok(bs.data.rows.at(-1).name === "Seimbang", "Neraca (balance sheet) seimbang");
const pl = await owner.call("GET", "/reports/profit-loss");
ok(pl.data.rows.at(-1).amount === "2500000.00", "Laba bersih = 2.500.000 (transfer bukan pendapatan; expense dibalik)");

// ── Produk, stok, penjualan
const p = await owner.call("POST", "/r/products", { sku: "SKU-1", name: "Kopi", kind: "product", price: "15000", trackStock: true, unit: "pcs" });
ok(p.status === 201, "Produk dibuat");
const pid = p.data.item.id;
r = await owner.call("POST", "/r/products", { sku: "SKU-1", name: "Dup", price: "1" });
ok(r.status === 409, "SKU duplikat ditolak");
r = await owner.call("POST", "/inventory/adjust", { productId: pid, direction: "in", quantity: "10", reason: "opening", unitCost: "9000" });
ok(r.status === 201, "Stok awal 10 @9.000");
r = await owner.call("POST", "/sales/checkout", { lines: [{ productId: pid, quantity: "11" }], payments: [{ accountId: kas.id, amount: "165000" }] });
ok(r.status === 409 && r.data.code === "insufficient_stock", "Stok tidak cukup ditolak");
// 5 checkout bersamaan masing-masing 3 → hanya 3 yang boleh berhasil (stok 10)
const results = await Promise.all(Array.from({ length: 5 }, () => owner.call("POST", "/sales/checkout", { lines: [{ productId: pid, quantity: "3" }], payments: [{ accountId: kas.id, amount: "45000" }] })));
const succ = results.filter((x) => x.status === 201).length;
ok(succ === 3, `Checkout bersamaan: ${succ} berhasil dari 5 (stok 10, @3) → tepat 3`);
const stock = (await owner.call("GET", "/inventory/stock")).data.items.find((x) => x.id === pid);
ok(stock.onHand === "1.000", "Stok akhir = 1 (tidak negatif): " + stock.onHand);
const cl = await owner.call("POST", "/r/clients", { type: "organization", name: "PT Uji", phone: "0812-3456" });
const cid = cl.data.item.id;
ok(cl.data.item.code.startsWith("CLI-"), "Kode klien otomatis " + cl.data.item.code);
r = await owner.call("POST", "/sales/checkout", { clientId: cid, channel: "invoice", lines: [{ productId: pid, quantity: "1" }], payments: [] });
ok(r.status === 201 && r.data.status === "unpaid", "Faktur kredit → piutang");
const invId = r.data.id;
r = await owner.call("POST", `/sales/invoices/${invId}/payments`, { accountId: bank.id, amount: "20000" });
ok(r.status === 422, "Pembayaran melebihi sisa ditolak");
r = await owner.call("POST", `/sales/invoices/${invId}/payments`, { accountId: bank.id, amount: "15000" });
ok(r.status === 201, "Pelunasan piutang");
const ar = (await owner.call("GET", "/finance/receivables")).data.items;
ok(ar.length === 0, "Piutang nol setelah pelunasan");
r = await owner.call("GET", `/crm/clients/${cid}`);
ok(r.data.financial.billed === "15000.00" && r.data.financial.outstanding === "0.00", "Ringkasan keuangan klien benar");
const tb2 = (await owner.call("GET", "/reports/trial-balance")).data.rows.at(-1);
ok(tb2.debit === tb2.credit, "Neraca saldo tetap seimbang setelah penjualan");

// ── Pembelian
const sup = await owner.call("POST", "/r/suppliers", { name: "Supplier A" });
const po = await owner.call("POST", "/purchasing/orders", { supplierId: sup.data.item.id, lines: [{ productId: pid, quantity: "20", unitCost: "10000" }] });
ok(po.status === 201, "PO dibuat");
const pol = (await owner.call("GET", "/purchasing/orders")).data.items[0].lines[0];
r = await owner.call("POST", `/purchasing/orders/${po.data.id}/receive`, { lines: [{ lineId: pol.id, quantity: "30" }] });
ok(r.status === 422, "Penerimaan melebihi pesanan ditolak");
r = await owner.call("POST", `/purchasing/orders/${po.data.id}/receive`, { lines: [{ lineId: pol.id, quantity: "10" }] });
ok(r.data.status === "partial", "Penerimaan parsial");
const ap = (await owner.call("GET", "/finance/payables")).data.items;
ok(ap.length === 1 && ap[0].outstanding === "100000.00", "Utang usaha 100.000");
r = await owner.call("POST", `/purchasing/bills/${ap[0].id}/payments`, { accountId: bank.id, amount: "100000" });
ok(r.status === 201, "Bayar tagihan supplier mengurangi utang");
const st2 = (await owner.call("GET", "/inventory/stock")).data.items.find((x) => x.id === pid);
ok(st2.onHand === "10.000", "Stok 0 + 10 diterima = 10");
const tb3 = (await owner.call("GET", "/reports/trial-balance")).data.rows.at(-1);
ok(tb3.debit === tb3.credit, "Neraca saldo seimbang setelah pembelian");

// ── Booking: double booking
const res = await owner.call("POST", "/r/booking-resources", { name: "Meja 1" });
const rid = res.data.item.id;
const slot = { resourceId: rid, customerName: "Budi", startsAt: "2030-01-01T10:00:00Z", endsAt: "2030-01-01T11:00:00Z" };
const bk = await Promise.all(Array.from({ length: 4 }, () => owner.call("POST", "/bookings", slot)));
ok(bk.filter((x) => x.status === 201).length === 1, "Booking bersamaan slot sama: tepat 1 berhasil");
r = await owner.call("POST", "/bookings", { ...slot, startsAt: "2030-01-01T10:30:00Z", endsAt: "2030-01-01T11:30:00Z" });
ok(r.status === 409, "Slot overlap ditolak");

// ── Kas
r = await owner.call("POST", "/cash/open", { accountId: kas.id, openingAmount: "100000" });
ok(r.status === 201, "Buka sesi kas");
r = await owner.call("POST", "/cash/open", { accountId: kas.id, openingAmount: "100000" });
ok(r.status === 409, "Sesi kas ganda ditolak");

// ── Pairing & revoke & RBAC
r = await owner.call("POST", "/devices/pairing", { role: "cashier" });
ok(r.status === 201 && /^[A-Z2-9]{8}$/.test(r.data.code), "Kode pairing dibuat");
const code = r.data.code;
const cashier = new Client();
const cashierUser = await makeUser("cashier");
cashier.user = cashierUser.cookie;
r = await cashier.call("POST", "/device/pair", { code: "ZZZZZZZZ", pin: "7391", confirm: "7391" });
ok(r.status === 422, "Kode pairing salah ditolak");
r = await cashier.call("POST", "/device/pair", { code, pin: "7391", confirm: "7391", deviceName: "Tablet Kasir" });
ok(r.status === 201, "Perangkat baru terhubung");
{
  const w = await pool.query("SELECT workspace_id FROM businesses WHERE name = $1", [draft.name]);
  globalThis.__wsId = w.rows[0]?.workspace_id;
  await pool.query("INSERT INTO workspace_members (workspace_id,user_id,role) VALUES ($1,$2,'cashier')", [globalThis.__wsId, cashierUser.id]);
}
r = await new Client().call("POST", "/device/pair", { code, pin: "7391", confirm: "7391" });
ok(r.status === 422, "Kode pairing sekali pakai");
r = await cashier.call("POST", "/device/unlock", { pin: "7391" });
cashier.tab = r.data.tab;
r = await cashier.call("GET", "/finance/transactions");
ok(r.status === 403, "Kasir tidak punya izin keuangan (RBAC di server)");
r = await cashier.call("GET", "/sales/pos-meta");
ok(r.status === 200, "Kasir dapat memakai POS");
r = await cashier.call("POST", "/devices/pairing", { role: "viewer" });
ok(r.status === 403, "Kasir tidak dapat mengelola perangkat");
const devs = (await owner.call("GET", "/devices")).data.items;
const cdev = devs.find((d) => d.name === "Tablet Kasir");
r = await owner.call("POST", `/devices/${cdev.id}/revoke`);
ok(r.status === 201, "Perangkat kasir dicabut");
r = await cashier.call("GET", "/sales/pos-meta");
ok(r.status === 401, "Sesi perangkat dicabut langsung ditolak");
const self = devs.find((d) => d.role === "owner");
r = await owner.call("POST", `/devices/${self.id}/revoke`);
ok(r.status === 409, "Tidak boleh mencabut satu-satunya owner");

// ── Ubah PIN tanpa PIN lama
r = await owner.call("POST", "/device/change-pin", { pin: "9152", confirm: "9152" });
ok(r.status === 200 && r.data.tab, "Ubah PIN tanpa PIN lama → langsung dapat sesi");
const oldTab = owner.tab; owner.tab = r.data.tab;
r = await owner.call("GET", "/dashboard", null, { "x-tab-session": oldTab });
ok(r.status === 401, "Sesi tab lama dicabut setelah ubah PIN");
r = await owner.call("POST", "/device/unlock", { pin: "4827" });
ok(r.status === 401, "PIN lama tidak berlaku");
r = await owner.call("POST", "/device/unlock", { pin: "9152" });
ok(r.status === 200, "PIN baru berlaku");
// ── Guard akun Google (sesi + membership)
{
  const outsider = await makeUser("outsider");
  const c1 = new Client(); c1.cookie = owner.cookie; c1.user = outsider.cookie;
  let rr = await c1.call("GET", "/dashboard", null, { "x-tab-session": owner.tab });
  ok(rr.status === 403 && rr.data?.code === "not_member", "User non-anggota + cookie perangkat valid ditolak (403 not_member)");
  const c2 = new Client(); c2.cookie = owner.cookie;
  rr = await c2.call("GET", "/dashboard", null, { "x-tab-session": owner.tab });
  ok(rr.status === 401 && rr.data?.code === "auth_required", "Tanpa sesi Google pada workspace berbasis akun ditolak (401)");
  const c3 = new Client(); c3.cookie = owner.cookie; c3.user = ownerUser.cookie;
  rr = await c3.call("POST", "/onboarding/complete", { ...draft });
  ok(rr.status === 200 || rr.status === 201, "Onboarding ulang pada perangkat yang sama idempoten (alreadyDone)");
  const member2 = await makeUser("member2");
  await pool.query("INSERT INTO workspace_members (workspace_id,user_id,role) VALUES ($1,$2,'manager')", [globalThis.__wsId, member2.id]);
  const c4 = new Client(); c4.cookie = owner.cookie; c4.user = member2.cookie;
  rr = await c4.call("GET", "/dashboard", null, { "x-tab-session": owner.tab });
  ok(rr.status === 200, "Anggota aktif (manager) + perangkat tergrant dapat mengakses");
  await pool.query("UPDATE workspace_members SET status='removed' WHERE user_id=$1", [member2.id]);
  rr = await c4.call("GET", "/dashboard", null, { "x-tab-session": owner.tab });
  ok(rr.status === 403 && rr.data?.code === "not_member", "Membership dicabut ⇒ akses ditolak walau cookie perangkat valid");
  await pool.query("DELETE FROM session WHERE user_id=$1", [ownerUser.id]);
  rr = await owner.call("GET", "/dashboard");
  ok(rr.status === 401 && rr.data?.code === "auth_required", "Sesi dicabut di DB ⇒ API 401 seketika");
  await pool.query("INSERT INTO session (id,expires_at,token,user_id) VALUES ($1, now() + interval '1 day', $2, $3)", [randomUUID(), ownerUser.token, ownerUser.id]);
}

// ── Undangan, anggota, klaim workspace lama
{
  const inviter = new Client(); inviter.cookie = owner.cookie; inviter.user = owner.user; inviter.tab = owner.tab;
  let rr = await inviter.call("POST", "/workspace/invitations", { role: "owner" });
  ok(rr.status === 422, "Undangan dengan role owner ditolak");
  rr = await inviter.call("POST", "/workspace/invitations", { role: "staff" });
  ok(rr.status === 201 && rr.data?.token, "Owner membuat undangan (token tampil sekali)");
  const token = rr.data.token;
  const hashRow = await pool.query("SELECT count(*)::int n FROM workspace_invitations WHERE token_hash = $1", [token]);
  ok(hashRow.rows[0].n === 0, "Token undangan tidak disimpan mentah (hanya hash)");
  const inv1 = await makeUser("inv1"), inv2 = await makeUser("inv2");
  const a = new Client(); a.user = inv1.cookie; const b2 = new Client(); b2.user = inv2.cookie;
  const [ra, rb] = await Promise.all([a.call("POST", "/invitations/accept", { token }), b2.call("POST", "/invitations/accept", { token })]);
  ok([ra.status, rb.status].sort().join() === "201,409", "Race dua penerima: tepat satu berhasil (" + [ra.status, rb.status] + ")");
  rr = await new Client().call("POST", "/invitations/accept", { token });
  ok(rr.status === 401, "Terima undangan tanpa login Google ditolak");
  const winner = ra.status === 201 ? inv1 : inv2;
  const mem = await pool.query("SELECT role,status FROM workspace_members WHERE user_id=$1", [winner.id]);
  ok(mem.rows[0]?.role === "staff" && mem.rows[0]?.status === "active", "Anggota baru berperan staff dan aktif");
  rr = await inviter.call("POST", "/workspace/invitations", { role: "viewer" });
  await pool.query("UPDATE workspace_invitations SET expires_at = now() - interval '1 minute' WHERE status='pending'");
  const inv3 = await makeUser("inv3"); const c = new Client(); c.user = inv3.cookie;
  rr = await c.call("POST", "/invitations/accept", { token: rr.data.token });
  ok(rr.status === 410, "Undangan kedaluwarsa ditolak (410)");
  rr = await c.call("POST", "/invitations/accept", { token: globalThis.__wsId + ".x".repeat(30) });
  ok(rr.status === 409, "Token palsu ditolak");
  const staffClient = new Client(); staffClient.cookie = owner.cookie; staffClient.user = winner.cookie; staffClient.tab = owner.tab;
  rr = await staffClient.call("POST", "/workspace/invitations", { role: "staff" });
  ok(rr.status === 403, "Staff tidak boleh mengundang (members:manage)");
  rr = await inviter.call("PATCH", "/workspace/members/" + winner.id, { role: "manager" });
  ok(rr.status === 200, "Owner mengubah role anggota");
  rr = await inviter.call("PATCH", "/workspace/members/" + ownerUser.id, { role: "viewer" });
  ok(rr.status === 422, "Owner tidak dapat diubah/menurunkan diri sendiri");

  // Klaim workspace lama
  const legacy = new Client();
  const lu = await makeUser("legacy"); legacy.user = lu.cookie;
  await legacy.call("POST", "/onboarding/pin", { pin: "5309", confirm: "5309" });
  rr = await legacy.call("POST", "/onboarding/complete", { ...draft, name: draft.name + " Lama" });
  ok(rr.status === 201 || rr.status === 200, "Workspace kedua dibuat");
  const w2 = await pool.query("SELECT workspace_id FROM businesses WHERE name = $1", [draft.name + " Lama"]);
  await pool.query("DELETE FROM workspace_members WHERE workspace_id=$1", [w2.rows[0].workspace_id]); // simulasi workspace lama (device-only)
  rr = await legacy.call("POST", "/device/unlock", { pin: "5309" }); legacy.tab = rr.data.tab;
  rr = await legacy.call("GET", "/dashboard");
  ok(rr.status === 200, "Workspace lama (tanpa membership) tetap berjalan device-only sebelum diklaim");
  const stranger = new Client(); stranger.cookie = legacy.cookie; stranger.tab = legacy.tab;
  rr = await stranger.call("POST", "/workspace/claim", {});
  ok(rr.status === 401, "Klaim tanpa sesi Google ditolak");
  const locked = new Client(); locked.cookie = legacy.cookie; locked.user = lu.cookie;
  rr = await locked.call("POST", "/workspace/claim", {});
  ok(rr.status === 401, "Klaim tanpa PIN perangkat terbuka ditolak (bukti kepemilikan)");
  const other = await makeUser("claimother");
  const oc = new Client(); oc.cookie = legacy.cookie; oc.tab = legacy.tab; oc.user = other.cookie;
  rr = await oc.call("POST", "/workspace/claim", {});
  ok(rr.status === 201, "Klaim dengan bukti (grant owner + PIN terbuka + sesi Google) berhasil");
  rr = await legacy.call("POST", "/workspace/claim", {});
  ok(rr.status === 401 || rr.status === 403 || rr.status === 409, "Klaim ganda ditolak");
  rr = await legacy.call("GET", "/dashboard");
  ok(rr.status === 403 && rr.data?.code === "not_member", "Setelah diklaim, user lain tidak lagi dapat memakai perangkat itu");
  const ev = await pool.query("SELECT count(*)::int n FROM auth_events WHERE type='workspace.claim'");
  ok(ev.rows[0].n >= 1, "Klaim tercatat di auth_events");
}

// ── Opname stok → jurnal selisih persediaan (F-07)
{
  const pr = (await owner.call("POST", "/r/products", { sku: "OPN-1", name: "Teh Opname", kind: "product", price: "20000", trackStock: true, unit: "pcs" })).data.item;
  await owner.call("POST", "/inventory/adjust", { productId: pr.id, direction: "in", quantity: "10", reason: "opening", unitCost: "9000" });
  const wh = (await pool.query("SELECT DISTINCT warehouse_id FROM stock_movements WHERE product_id=$1", [pr.id])).rows[0].warehouse_id;
  const glInv = async () => Number((await pool.query(`SELECT COALESCE(sum(jl.debit - jl.credit),0)::text v FROM journal_lines jl JOIN coa_accounts a ON a.id=jl.account_id WHERE a.workspace_id=$1 AND a.subtype='inventory'`, [globalThis.__wsId])).rows[0].v);
  const stockVal = async () => Number((await pool.query(`SELECT COALESCE(sum(m.quantity * m.unit_cost),0)::text v FROM stock_movements m WHERE m.workspace_id=$1`, [globalThis.__wsId])).rows[0].v);
  const before = await glInv();
  let rr = await owner.call("POST", "/p2/stock-counts", { warehouseId: wh, items: [{ productId: pr.id, countedQty: 7 }] });
  ok(rr.status === 201, "Opname dibuat dan diposting (fisik 7, sistem 10)");
  const mv = await pool.query("SELECT quantity::text q, unit_cost::text c FROM stock_movements WHERE product_id=$1 AND ref_type='stock_count'", [pr.id]);
  ok(mv.rows.length === 1 && Number(mv.rows[0].q) === -3 && Number(mv.rows[0].c) === 9000, "Selisih -3 tercatat satu kali dengan biaya rata-rata 9.000");
  const jl = await pool.query(`SELECT a.subtype, jl.debit::text d, jl.credit::text c FROM journal_lines jl JOIN journal_entries je ON je.id=jl.entry_id JOIN coa_accounts a ON a.id=jl.account_id WHERE je.source='stock_count' AND je.source_id=$1`, [rr.data.id]);
  ok(jl.rows.some((x) => x.subtype === "variance" && Number(x.d) === 27000) && jl.rows.some((x) => x.subtype === "inventory" && Number(x.c) === 27000), "Jurnal selisih: beban selisih 27.000 (D) / persediaan (K)");
  ok(Math.round(before - (await glInv())) === 27000, "Saldo GL persediaan turun tepat 27.000");
  rr = await owner.call("POST", "/p2/stock-counts/" + rr.data.id + "/post", {});
  ok(rr.status === 409, "Posting ulang opname ditolak (tidak ada penyesuaian ganda)");
  const cnt = await pool.query("SELECT count(*)::int n FROM stock_movements WHERE product_id=$1 AND ref_type='stock_count'", [pr.id]);
  ok(cnt.rows[0].n === 1, "Tetap satu mutasi stok opname setelah percobaan posting ulang");
  rr = await owner.call("POST", "/p2/stock-counts", { warehouseId: wh, status: "draft", items: [{ productId: pr.id, countedQty: 9 }] });
  const draftId = rr.data.id;
  rr = await owner.call("POST", "/p2/stock-counts/" + draftId + "/post", {});
  ok(rr.status === 201 || rr.status === 200, "Opname draft diposting lewat /post (selisih +2 sistem 7 → 9)");
  const bal = await pool.query(`SELECT sum(jl.debit)::text d, sum(jl.credit)::text c FROM journal_lines jl JOIN journal_entries je ON je.id=jl.entry_id WHERE je.source='stock_count'`);
  ok(bal.rows[0].d === bal.rows[0].c, "Semua jurnal opname seimbang");
}

// ── Siklus hidup ekspor (F-08)
{
  const inv = await pool.query("SELECT id FROM invoices WHERE workspace_id=$1 ORDER BY issued_at DESC LIMIT 1", [globalThis.__wsId]);
  const invoiceId = inv.rows[0]?.id;
  ok(Boolean(invoiceId), "Ada faktur untuk diekspor");
  let rr = await owner.call("POST", "/exports/receipt", { invoiceId, format: "pdf", templatePreset: "a4" });
  ok(rr.status === 201 && rr.data.id, "Ekspor struk A4 dibuat");
  const id = rr.data.id;
  let st = (await pool.query("SELECT status FROM export_records WHERE id=$1", [id])).rows[0].status;
  ok(st === "pending", "Status awal 'pending' (bukan 'completed' sebelum file dibuat)");
  rr = await owner.call("POST", "/exports/" + id + "/complete", {});
  st = (await pool.query("SELECT status FROM export_records WHERE id=$1", [id])).rows[0].status;
  ok(rr.status === 201 || rr.status === 200, "Klien mengonfirmasi selesai"); ok(st === "completed", "Status menjadi 'completed' hanya setelah konfirmasi");
  rr = await owner.call("POST", "/exports/" + id + "/fail", { error: "x" });
  ok(rr.status === 409, "Ekspor yang sudah selesai tidak dapat ditandai gagal");
  const r2 = await owner.call("POST", "/exports/receipt", { invoiceId, format: "png", templatePreset: "a5" });
  rr = await owner.call("POST", "/exports/" + r2.data.id + "/fail", { error: "Render gagal" });
  const f = (await pool.query("SELECT status, error FROM export_records WHERE id=$1", [r2.data.id])).rows[0];
  ok(f.status === "failed" && f.error === "Render gagal", "Kegagalan render tercatat 'failed' beserta alasannya");
  await pool.query("UPDATE export_records SET created_at = now() - interval '20 minutes' WHERE id = (SELECT id FROM export_records WHERE status='pending' ORDER BY created_at DESC LIMIT 1)");
  const pv = await owner.call("POST", "/exports/receipt", { invoiceId, format: "pdf", templatePreset: "80mm", download: false });
  rr = await owner.call("GET", "/exports/history");
  ok(!rr.data.items.some((x) => x.id === pv.data.id), "Pratinjau tidak masuk riwayat");
  ok(rr.data.items.find((x) => x.id === id)?.status === "completed" && rr.data.items.find((x) => x.id === r2.data.id)?.status === "failed", "Riwayat menampilkan status nyata");
  const stale = await pool.query("INSERT INTO export_records (workspace_id,kind,format,template_preset,report_number,verification_code,snapshot,status,created_at) VALUES ($1,'receipt','pdf','a4','X','V','{}','pending', now() - interval '20 minutes') RETURNING id", [globalThis.__wsId]);
  rr = await owner.call("GET", "/exports/history");
  ok(rr.data.items.find((x) => x.id === stale.rows[0].id)?.status === "failed", "Ekspor 'pending' > 10 menit ditampilkan gagal (tidak menggantung selamanya)");
}

// ── Retur supplier (F-07)
{
  const pr = (await owner.call("POST", "/r/products", { sku: "RTR-1", name: "Susu Retur", kind: "product", price: "30000", trackStock: true, unit: "pcs" })).data.item;
  const sp = (await owner.call("POST", "/r/suppliers", { name: "Supplier Retur" })).data.item;
  const po2 = (await owner.call("POST", "/purchasing/orders", { supplierId: sp.id, lines: [{ productId: pr.id, quantity: "10", unitCost: "6000" }] })).data;
  const line = (await owner.call("GET", "/purchasing/orders")).data.items.find((x) => x.id === po2.id).lines[0];
  await owner.call("POST", `/purchasing/orders/${po2.id}/receive`, { lines: [{ lineId: line.id, quantity: "10" }] });
  const billBefore = (await pool.query("SELECT id, total::text t FROM supplier_bills WHERE po_id=$1", [po2.id])).rows[0];
  ok(billBefore?.t === "60000.00", "Tagihan PO 60.000 tercipta dari penerimaan");
  const glAp = async () => Number((await pool.query(`SELECT COALESCE(sum(jl.credit - jl.debit),0)::text v FROM journal_lines jl JOIN coa_accounts a ON a.id=jl.account_id WHERE a.workspace_id=$1 AND a.subtype='payable'`, [globalThis.__wsId])).rows[0].v);
  const glInv = async () => Number((await pool.query(`SELECT COALESCE(sum(jl.debit - jl.credit),0)::text v FROM journal_lines jl JOIN coa_accounts a ON a.id=jl.account_id WHERE a.workspace_id=$1 AND a.subtype='inventory'`, [globalThis.__wsId])).rows[0].v);
  const ap0 = await glAp(), inv0 = await glInv();
  let rr = await owner.call("POST", "/p2/supplier-returns", { poId: po2.id, reason: "Cacat", total: "999999999", items: [{ productId: pr.id, qty: "3" }] });
  ok(rr.status === 201 && rr.data.totalCents === "1800000", "Retur 3 × 6.000 = 18.000 dihitung server (total dari klien diabaikan)");
  const bill = (await pool.query("SELECT total::text t, status FROM supplier_bills WHERE id=$1", [billBefore.id])).rows[0];
  ok(bill.t === "42000.00", "Tagihan pemasok berkurang menjadi 42.000");
  ok(Math.round(ap0 - (await glAp())) === 18000 && Math.round(inv0 - (await glInv())) === 18000, "GL hutang −18.000 dan GL persediaan −18.000 (seimbang dengan subledger)");
  const stk = Number((await pool.query("SELECT COALESCE(sum(quantity),0)::text q FROM stock_movements WHERE product_id=$1", [pr.id])).rows[0].q);
  ok(stk === 7, "Stok berkurang 3 (10 → 7)");
  rr = await owner.call("POST", "/p2/supplier-returns", { poId: po2.id, reason: "x", items: [{ productId: pr.id, qty: "20" }] });
  ok(rr.status === 409, "Retur melebihi stok ditolak");
  rr = await owner.call("POST", "/p2/supplier-returns", { poId: po2.id, reason: "x", items: [{ productId: pr.id, qty: "3", unitCost: "100000" }] });
  ok(rr.status === 422, "Nilai retur melebihi sisa tagihan ditolak");
  const diff = await owner.call("POST", "/p2/supplier-returns", { poId: po2.id, reason: "harga kredit berbeda", items: [{ productId: pr.id, qty: "2", unitCost: "7000" }] });
  ok(diff.status === 201, "Retur dengan harga kredit pemasok berbeda diterima");
  const jb = await pool.query(`SELECT sum(jl.debit)::text d, sum(jl.credit)::text c FROM journal_lines jl JOIN journal_entries je ON je.id=jl.entry_id WHERE je.source='supplier_return'`);
  ok(jb.rows[0].d === jb.rows[0].c, "Semua jurnal retur seimbang (selisih harga ke akun selisih)");
  rr = await owner.call("POST", "/p2/supplier-returns", { poId: randomUUID(), reason: "x", items: [{ productId: pr.id, qty: "1" }] });
  ok(rr.status === 404, "PO asing ditolak");
}

// ── Produksi / work order (F-07)
{
  const mat = (await owner.call("POST", "/r/products", { sku: "MAT-1", name: "Tepung", kind: "product", price: "2000", trackStock: true, unit: "kg" })).data.item;
  const fin = (await owner.call("POST", "/r/products", { sku: "FIN-1", name: "Roti", kind: "product", price: "5000", trackStock: true, unit: "pcs" })).data.item;
  await owner.call("POST", "/inventory/adjust", { productId: mat.id, direction: "in", quantity: "100", reason: "opening", unitCost: "1000" });
  const rec = (await owner.call("POST", "/prd/recipes", { productId: fin.id, name: "Resep Roti", yieldQty: 10, ingredients: [{ name: "Tepung", qty: 5, productId: mat.id }] })).data;
  ok(rec?.id, "Resep dibuat");
  const stockOf = async (id) => Number((await pool.query("SELECT COALESCE(sum(quantity),0)::text q FROM stock_movements WHERE product_id=$1", [id])).rows[0].q);
  const glInv = async () => Number((await pool.query(`SELECT COALESCE(sum(jl.debit - jl.credit),0)::text v FROM journal_lines jl JOIN coa_accounts a ON a.id=jl.account_id WHERE a.workspace_id=$1 AND a.subtype='inventory'`, [globalThis.__wsId])).rows[0].v);
  const wo = (await owner.call("POST", "/prd/work-orders", { recipeId: rec.id, plannedQty: 10 })).data;
  const g0 = await glInv();
  let rr = await owner.call("POST", "/prd/work-orders/" + wo.id + "/complete", { actualQty: "8", wasteQty: "2" });
  ok(rr.status === 201 || rr.status === 200, "Work order selesai (hasil 8, waste 2)");
  ok((await stockOf(mat.id)) === 95 && (await stockOf(fin.id)) === 8, "Bahan −5 (resep 5 per 10 unit) dan hasil +8");
  const fa = Number((await pool.query("SELECT avg_cost::text c FROM products WHERE id=$1", [fin.id])).rows[0].c);
  ok(fa === 500, "Biaya rata-rata hasil jadi = 4.000 / 8 = 500 (bukan 0)");
  ok(Math.round(g0 - (await glInv())) === 1000, "Kerugian waste 2/10 × 5.000 = 1.000 mengurangi GL persediaan");
  const jl = await pool.query(`SELECT a.subtype, jl.debit::text d, jl.credit::text c FROM journal_lines jl JOIN journal_entries je ON je.id=jl.entry_id JOIN coa_accounts a ON a.id=jl.account_id WHERE je.source='production_loss' AND je.source_id=$1`, [wo.id]);
  ok(jl.rows.length === 2 && jl.rows.some((x) => x.subtype === "variance" && Number(x.d) === 1000), "Jurnal kerugian produksi seimbang (beban selisih D 1.000)");
  rr = await owner.call("POST", "/prd/work-orders/" + wo.id + "/complete", { actualQty: "8", wasteQty: "2" });
  ok(rr.status === 409, "Work order tidak dapat diselesaikan dua kali");
  const wo2 = (await owner.call("POST", "/prd/work-orders", { recipeId: rec.id, plannedQty: 100 })).data;
  rr = await owner.call("POST", "/prd/work-orders/" + wo2.id + "/complete", { actualQty: "300", wasteQty: "0" });
  ok(rr.status === 409, "Produksi melebihi stok bahan ditolak (tidak ada stok negatif)");
  ok((await stockOf(mat.id)) === 95, "Stok bahan tidak berubah setelah penolakan (transaksi atomik)");
}

// ── Transfer stok & waste (F-07)
{
  const pr = (await owner.call("POST", "/r/products", { sku: "TRF-1", name: "Gula Transfer", kind: "product", price: "20000", trackStock: true, unit: "pcs" })).data.item;
  await owner.call("POST", "/inventory/adjust", { productId: pr.id, direction: "in", quantity: "10", reason: "opening", unitCost: "5000" });
  const wh1 = (await pool.query("SELECT DISTINCT warehouse_id FROM stock_movements WHERE product_id=$1", [pr.id])).rows[0].warehouse_id;
  const wh2 = (await pool.query("INSERT INTO warehouses (workspace_id, business_id, name) SELECT workspace_id, business_id, 'Gudang Dua' FROM warehouses WHERE id=$1 RETURNING id", [wh1])).rows[0].id;
  const stock = async (w) => Number((await pool.query("SELECT COALESCE(sum(quantity),0)::text q FROM stock_movements WHERE product_id=$1 AND warehouse_id=$2", [pr.id, w])).rows[0].q);
  const glInv = async () => Number((await pool.query(`SELECT COALESCE(sum(jl.debit - jl.credit),0)::text v FROM journal_lines jl JOIN coa_accounts a ON a.id=jl.account_id WHERE a.workspace_id=$1 AND a.subtype='inventory'`, [globalThis.__wsId])).rows[0].v);
  const gl0 = await glInv();
  let rr = await owner.call("POST", "/p2/stock-transfers", { fromWarehouseId: wh1, toWarehouseId: wh2, productId: pr.id, qty: 4 });
  ok(rr.status === 201, "Transfer 4 pcs gudang 1 → gudang 2 selesai");
  ok((await stock(wh1)) === 6 && (await stock(wh2)) === 4, "Stok asal 6 dan tujuan 4 (total tetap 10)");
  ok(Math.abs((await glInv()) - gl0) < 0.001, "Transfer antar gudang tidak mengubah GL persediaan");
  rr = await owner.call("POST", "/p2/stock-transfers", { fromWarehouseId: wh1, toWarehouseId: wh2, productId: pr.id, qty: 7 });
  ok(rr.status === 409, "Transfer melebihi stok asal ditolak (409)");
  const par = await Promise.all([1, 2].map(() => owner.call("POST", "/p2/stock-transfers", { fromWarehouseId: wh1, toWarehouseId: wh2, productId: pr.id, qty: 4 })));
  ok(par.map((x) => x.status).sort().join() === "201,409" && (await stock(wh1)) === 2, "Dua transfer paralel pada stok terbatas: satu berhasil, stok tidak negatif");
  rr = await owner.call("POST", "/p2/stock-transfers", { fromWarehouseId: wh1, toWarehouseId: wh2, productId: pr.id, qty: 1, status: "draft" });
  const tid = rr.data.id;
  rr = await owner.call("POST", "/p2/stock-transfers/" + tid + "/complete", {});
  ok(rr.status === 201 || rr.status === 200, "Transfer draft diselesaikan lewat /complete");
  rr = await owner.call("POST", "/p2/stock-transfers/" + tid + "/complete", {});
  ok(rr.status === 409, "Transfer yang sudah selesai tidak dapat diselesaikan dua kali");
  // waste
  const g1 = await glInv();
  rr = await owner.call("POST", "/prd/waste", { productId: pr.id, warehouseId: wh2, qty: "2", reason: "Rusak", cost: "999999" });
  ok(rr.status === 201 && rr.data.valueCents === "1000000", "Waste 2 × biaya rata-rata 5.000 = 10.000 (cost dari klien diabaikan)");
  ok(Math.round(g1 - (await glInv())) === 10000, "GL persediaan turun 10.000 karena waste");
  const wj = await pool.query(`SELECT a.subtype, jl.debit::text d, jl.credit::text c FROM journal_lines jl JOIN journal_entries je ON je.id=jl.entry_id JOIN coa_accounts a ON a.id=jl.account_id WHERE je.source='stock_waste' AND je.source_id=$1`, [rr.data.id]);
  ok(wj.rows.length === 2 && wj.rows.every((x) => Number(x.d) === 10000 || Number(x.c) === 10000), "Jurnal waste seimbang 10.000");
  rr = await owner.call("POST", "/prd/waste", { productId: pr.id, warehouseId: wh2, qty: "999", reason: "x" });
  ok(rr.status === 409, "Waste melebihi stok ditolak");
}

// ── Payroll dihitung server (F-06)
{
  const e1 = (await owner.call("POST", "/r/employees", { name: "Sari Payroll", salary: "5000000" })).data?.item;
  const e2 = (await owner.call("POST", "/r/employees", { name: "Budi Payroll", salary: "3000000" })).data?.item;
  ok(e1?.id && e2?.id, "Karyawan dengan gaji pokok dibuat");
  for (const d of ["2026-03-02", "2026-03-03"]) await owner.call("POST", "/r/attendance", { employeeId: e1.id, workDate: d, status: "alpa" });
  await owner.call("POST", "/r/attendance", { employeeId: e2.id, workDate: "2026-03-02", status: "sakit" });
  let rr = await owner.call("POST", "/p2/payroll-runs", { periodMonth: "2026-03", items: [{ employeeId: e1.id, name: "x", gross: "999999999", deductions: "0" }] , absence: { mode: "per_working_day", workingDays: 22 }, employeeIds: [e1.id] });
  ok(rr.status === 201, "Payroll draft dibuat (field items/gross dari klien DIABAIKAN)");
  const run = rr.data;
  const items = (await pool.query("SELECT items, total_gross::text g, total_net::text n, status FROM payroll_runs WHERE id=$1", [run.id])).rows[0];
  ok(items.g === "500000000" && items.status === "draft", "Gaji kotor dari data karyawan (5.000.000), bukan angka klien");
  ok(items.items[0].absentDays === 2 && items.items[0].absenceDeduction === "45454545", "Potongan absensi dari data absensi: 2 hari alpa → 454.545,45 dibulatkan bawah");
  ok(items.n === String(500000000 - 45454545), "Gaji bersih = kotor − potongan (vektor)");
  rr = await owner.call("POST", "/p2/payroll-runs", { periodMonth: "2026-03", employeeIds: [e1.id] });
  ok(rr.status === 409, "Satu run aktif per periode (duplikat ditolak)");
  rr = await owner.call("POST", "/p2/payroll-runs", { periodMonth: "2026-04", adjustments: [{ employeeId: randomUUID(), kind: "allowance", label: "x", amount: "1" }] });
  ok(rr.status === 422, "Penyesuaian untuk karyawan di luar run ditolak");
  rr = await owner.call("POST", "/p2/payroll-runs", { periodMonth: "2026-04", employeeIds: [e2.id], adjustments: [{ employeeId: e2.id, kind: "deduction", label: "Kasbon", amount: "9000000" }] });
  ok(rr.status === 422, "Potongan melebihi gaji kotor ditolak (bukan dipotong diam-diam jadi 0)");
  const [q1, q2] = await Promise.all([owner.call("POST", "/p2/payroll-runs/" + run.id + "/post", {}), owner.call("POST", "/p2/payroll-runs/" + run.id + "/post", {})]);
  ok([q1.status, q2.status].sort().join() === "201,409", "Posting paralel: tepat satu berhasil (" + [q1.status, q2.status] + ")");
  const jl = await pool.query(`SELECT a.subtype, jl.debit::text d, jl.credit::text c FROM journal_lines jl JOIN journal_entries je ON je.id=jl.entry_id JOIN coa_accounts a ON a.id=jl.account_id WHERE je.source='payroll' AND je.source_id=$1`, [run.id]);
  const d = jl.rows.reduce((x, y) => x + Number(y.d), 0), c = jl.rows.reduce((x, y) => x + Number(y.c), 0);
  ok(Math.abs(d - c) < 0.001 && d > 0, "Jurnal gaji seimbang (debit = kredit)");
  ok(jl.rows.some((x) => x.subtype === "payroll_expense" && Number(x.d) === 4545454.55), "Beban gaji = kotor − potongan absensi");
  ok(jl.rows.some((x) => x.subtype === "payroll_payable" && Number(x.c) === 4545454.55), "Utang gaji = gaji bersih");
  rr = await owner.call("POST", "/p2/payroll-runs/" + run.id + "/reverse", {});
  ok(rr.status === 201 || rr.status === 200, "Payroll posted dibalik lewat jurnal balik");
  const net = await pool.query(`SELECT sum(jl.debit)::text d, sum(jl.credit)::text c FROM journal_lines jl JOIN journal_entries je ON je.id=jl.entry_id WHERE je.source_id=$1`, [run.id]);
  ok(net.rows[0].d === net.rows[0].c, "Seluruh jurnal payroll seimbang setelah pembalikan");
  rr = await owner.call("GET", "/p2/payroll-runs/" + run.id + "/slip/" + e1.id);
  ok(rr.status === 200 && rr.data.item.trace.length > 2, "Slip gaji memuat jejak perhitungan");
  const cashierC = new Client(); cashierC.cookie = cashier.cookie; cashierC.user = cashier.user;
}

// ── Depresiasi aset → jurnal (F-04)
{
  const mk = async (name, method) => (await owner.call("POST", "/prd/assets", { name, acquisitionDate: "2026-01-10", acquisitionCost: "12000000", residualValue: "0", usefulLifeMonths: 12, method })).data;
  const sl = await mk("Mesin SL", "straight_line"), db2 = await mk("Mesin DB", "declining_balance");
  ok(sl?.id && db2?.id, "Aset dibuat (garis lurus & saldo menurun)");
  let rr = await owner.call("GET", "/prd/assets/" + sl.id + "/depreciation-preview?periodMonth=2026-01");
  ok(rr.status === 200 && rr.data.amountCents === "100000000", "Preview garis lurus 12.000.000/12 = 1.000.000 (vektor)");
  rr = await owner.call("GET", "/prd/assets/" + db2.id + "/depreciation-preview?periodMonth=2026-01");
  ok(rr.data.amountCents === "200000000", "Preview saldo menurun ganda: 12.000.000×2/12 = 2.000.000 (vektor)");
  const before = await pool.query("SELECT count(*)::int n FROM journal_entries WHERE workspace_id=$1 AND source='asset_depreciation'", [globalThis.__wsId]);
  ok(before.rows[0].n === 0, "Preview tidak mem-post jurnal");
  const [p1, p2] = await Promise.all([
    owner.call("POST", "/prd/assets/" + sl.id + "/depreciate", { periodMonth: "2026-01" }),
    owner.call("POST", "/prd/assets/" + sl.id + "/depreciate", { periodMonth: "2026-01" }),
  ]);
  ok([p1.status, p2.status].sort().join() === "201,409", "Depresiasi paralel periode sama: tepat satu berhasil (" + [p1.status, p2.status] + ")");
  const je = await pool.query(`SELECT jl.debit::text d, jl.credit::text c, a.subtype FROM journal_lines jl JOIN journal_entries je ON je.id=jl.entry_id JOIN coa_accounts a ON a.id=jl.account_id WHERE je.source='asset_depreciation' AND je.source_id=$1`, [sl.id]);
  const dsum = je.rows.reduce((x, y) => x + Number(y.d), 0), csum = je.rows.reduce((x, y) => x + Number(y.c), 0);
  ok(je.rows.length === 2 && dsum === 1000000 && csum === 1000000, "Jurnal penyusutan seimbang 1.000.000 (beban debit, akumulasi kredit)");
  ok(je.rows.some((x) => x.subtype === "dep_expense" && Number(x.d) === 1000000) && je.rows.some((x) => x.subtype === "accum_dep" && Number(x.c) === 1000000), "Akun beban penyusutan & akumulasi benar");
  const asset = await pool.query("SELECT book_value_cents::text bv, accumulated_dep_cents::text acc FROM fixed_assets WHERE id=$1", [sl.id]);
  ok(asset.rows[0].bv === "1100000000" && asset.rows[0].acc === "100000000", "Nilai buku & akumulasi diperbarui tepat satu kali");
  rr = await owner.call("POST", "/prd/assets/" + sl.id + "/depreciate", { periodMonth: "2025-12" });
  ok(rr.status === 422, "Periode sebelum perolehan ditolak");
  rr = await owner.call("POST", "/prd/assets/" + sl.id + "/depreciation/reverse", { periodMonth: "2026-01" });
  ok(rr.status === 201 || rr.status === 200, "Pembalikan memposting jurnal balik");
  const bal = await pool.query(`SELECT sum(jl.debit)::text d, sum(jl.credit)::text c FROM journal_lines jl JOIN journal_entries je ON je.id=jl.entry_id WHERE je.source_id=$1 AND je.source IN ('asset_depreciation','reversal')`, [sl.id]);
  ok(bal.rows[0].d === bal.rows[0].c, "Total debit = kredit setelah pembalikan");
  const back = await pool.query("SELECT book_value_cents::text bv FROM fixed_assets WHERE id=$1", [sl.id]);
  ok(back.rows[0].bv === "1200000000", "Nilai buku kembali setelah pembalikan");
  rr = await owner.call("POST", "/prd/assets/" + sl.id + "/depreciate", { periodMonth: "2026-01" });
  ok(rr.status === 201, "Periode yang dibalik dapat diposting ulang");
  // periode terakhir menutup sisa pembulatan: 10.000.003 / 3 bulan
  const odd = (await owner.call("POST", "/prd/assets", { name: "Mesin Ganjil", acquisitionDate: "2026-01-01", acquisitionCost: "10000003", residualValue: "0", usefulLifeMonths: 3, method: "straight_line" })).data;
  let total = 0n;
  for (const m of ["2026-01", "2026-02", "2026-03"]) { const x = await owner.call("POST", "/prd/assets/" + odd.id + "/depreciate", { periodMonth: m }); total += BigInt(x.data?.amountCents ?? 0); }
  ok(total === 1000000300n, "Total penyusutan = biaya perolehan tepat (sisa pembulatan ditutup periode akhir)");
  rr = await owner.call("POST", "/prd/assets/" + odd.id + "/depreciate", { periodMonth: "2026-04" });
  ok(rr.status === 422, "Aset yang sudah habis disusutkan ditolak");
}

// brute force lock
const brute = new Client(); brute.cookie = owner.cookie; brute.user = owner.user;
for (let i = 0; i < 5; i++) await brute.call("POST", "/device/unlock", { pin: "0001" });
r = await brute.call("POST", "/device/unlock", { pin: "9152" });
ok(r.status === 429, "Brute-force PIN: perangkat dikunci sementara setelah 5 gagal");

console.log(`\nHASIL: ${pass} PASS, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
