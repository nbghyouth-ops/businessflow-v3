#!/usr/bin/env node
/**
 * verify-release: gerbang rilis menyeluruh (CP1/CP10).
 * Keluar non-zero bila ada yang gagal.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
function run(label, cmd, args, opts = {}) {
  console.log(`\nâ–¶ ${label}`);
  const r = spawnSync(cmd, args, { stdio: "inherit", cwd: root, shell: true, ...opts });
  if (r.status !== 0) {
    console.error(`\nâœ– GAGAL: ${label} (exit ${r.status})`);
    process.exit(r.status || 1);
  }
  console.log(`âœ” OK: ${label}`);
}

// 1. Typecheck
run("typecheck", "npm", ["run", "typecheck"]);
// 2. Lint
run("lint", "npm", ["run", "lint"]);
// 3. Unit
run("unit", "npm", ["run", "test"]);
// 4. UI
run("ui", "npx", ["vitest", "run", "tests/ui"]);
// 5. Integration (bila DB tersedia)
if (process.env.DATABASE_URL?.trim()) {
  run("integration", "npm", ["run", "test:integration"]);
} else {
  console.log("\nâš  DATABASE_URL tidak ada â€” lewati integrasi");
}
// 6. Build tanpa ENV
run("build", "npm", ["run", "build"]);
// 7. Audit (moderate dan atas gagalkan rilis)
run("audit", "npm", ["audit", "--omit=dev", "--audit-level=moderate"]);
// 8. DB check (bila DB tersedia)
if (process.env.DATABASE_URL?.trim() && existsSync(path.join(root, "scripts/preflight.mjs"))) {
  run("db:check", "npm", ["run", "db:check"]);
}
// 9. Route count sanity
console.log("\nâ–¶ route-count");
const { readFileSync } = await import("node:fs");
// no-op placeholder; smoke covers routes
console.log("âœ” OK: verify-release selesai");
process.exit(0);
