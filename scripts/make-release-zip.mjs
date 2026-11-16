#!/usr/bin/env node
/**
 * make-release-zip: bangun ZIP dengan allowlist eksplisit.
 * Usage: node scripts/make-release-zip.mjs <mode> <output.zip>
 *   mode: deploy-vercel | deploy-standalone | deploy-db | qa-evidence | source | android | opsional
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const mode = process.argv[2];
const out = process.argv[3];
if (!mode || !out) {
  console.error("Usage: node scripts/make-release-zip.mjs <deploy-vercel|deploy-standalone|deploy-db|qa-evidence|source|android|opsional> <output.zip>");
  process.exit(2);
}

const root = process.cwd();
const stage = path.join(os.tmpdir(), `bf-stage-${mode}-${Date.now()}`);
rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });

function copy(rel) {
  const src = path.join(root, rel);
  const dst = path.join(stage, rel);
  if (!existsSync(src)) { console.warn("skip (missing):", rel); return; }
  mkdirSync(path.dirname(dst), { recursive: true });
  const st = statSync(src);
  if (st.isDirectory()) cpSync(src, dst, { recursive: true });
  else cpSync(src, dst);
}

// Allowlists
const deployFiles = [
  "package.json", "package-lock.json", "next.config.ts", "tsconfig.json",
  "postcss.config.mjs", "vercel.json", ".env.example", ".gitignore",
  "next-env.d.ts", "README.md", "PANDUAN_DEPLOY.md",
];
const deployDirs = ["public", "src"];
const deployScripts = [
  "scripts/migrate.mjs", "scripts/bundle-sql.mjs", "scripts/preflight.mjs",
  "scripts/migrations-manifest.mjs", "scripts/migrations-manifest.d.mts",
];
const deploySql = "scripts/sql";
const deployDrizzle = "drizzle/ALL_IN_ONE.sql";
const deployDrizzleMigrations = "drizzle/migrations";

const devQaFiles = [
  "tests", "docs", "archive",
  "ACCEPTANCE_MATRIX.md", "BUG_REGISTER.md", "TRACEABILITY_MATRIX.md",
  "TEST_EVIDENCE.md", "UAT_MANUAL.md", "ROADMAP_LANJUTAN.md", "PROGRESS.md",
  "LAPORAN_AKHIR.md",
  "vitest.config.mts", "playwright.config.ts", "eslint.config.mjs", "drizzle.config.ts",
];
const devQaDirs = ["drizzle/migrations/meta", "scripts"];
const devQaScripts = ["scripts/smoke-api.mjs", "scripts/verify-release.mjs", "scripts/make-release-zip.mjs"];

const opsionalFiles = ["android", "capacitor.config.ts", "functions"];

if (mode === "deploy-vercel") {
  deployFiles.forEach(copy);
  deployDirs.forEach(copy);
  deployScripts.forEach(copy);
  if (existsSync(path.join(root, deploySql))) copy(deploySql);
  if (existsSync(path.join(root, deployDrizzle))) copy(deployDrizzle);
  if (existsSync(path.join(root, deployDrizzleMigrations))) copy(deployDrizzleMigrations);
} else if (mode === "deploy-standalone") {
  deployFiles.forEach(copy);
  // standalone build output (next start) handled by operator; src + scripts included
  deployDirs.forEach(copy);
  deployScripts.forEach(copy);
  if (existsSync(path.join(root, deploySql))) copy(deploySql);
  if (existsSync(path.join(root, deployDrizzle))) copy(deployDrizzle);
  if (existsSync(path.join(root, deployDrizzleMigrations))) copy(deployDrizzleMigrations);
} else if (mode === "deploy-db") {
  // database migration package only
  if (existsSync(path.join(root, deployDrizzleMigrations))) copy(deployDrizzleMigrations);
  if (existsSync(path.join(root, deploySql))) copy(deploySql);
  deployScripts.forEach(copy);
} else if (mode === "qa-evidence") {
  devQaFiles.forEach(copy);
  if (existsSync(path.join(root, "drizzle/migrations/meta"))) copy("drizzle/migrations/meta");
  devQaScripts.forEach(copy);
} else if (mode === "source") {
  // source package: everything except secrets and node_modules
  cpSync(root, stage, { recursive: true });
  rmSync(path.join(stage, "node_modules"), { recursive: true, force: true });
  rmSync(path.join(stage, ".next"), { recursive: true, force: true });
  rmSync(path.join(stage, ".env"), { force: true });
  rmSync(path.join(stage, "tsconfig.tsbuildinfo"), { force: true });
} else if (mode === "android") {
  opsionalFiles.forEach(copy);
} else if (mode === "opsional") {
  opsionalFiles.forEach(copy);
} else {
  console.error("Unknown mode:", mode);
  process.exit(2);
}

// Zip via tar
const absOut = path.resolve(out);
rmSync(absOut, { force: true });
const r = spawnSync("tar", ["-a", "-c", "-f", absOut, "-C", stage, "."], { stdio: "inherit", shell: true });
if (r.status !== 0) {
  console.error("tar failed", r.status);
  process.exit(1);
}
console.log("Created", absOut);
// cleanup
rmSync(stage, { recursive: true, force: true });
process.exit(0);
