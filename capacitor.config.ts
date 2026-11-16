import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Android shell untuk Business Flow.
 * Pemilik dapat mengisi konstanta PRODUCTION_URL di bawah ATAU menyetel CAP_SERVER_URL saat build:
 *   CAP_SERVER_URL=https://domain-anda.vercel.app npx cap sync android
 */
export const PRODUCTION_URL = "";

const serverUrl = process.env.CAP_SERVER_URL?.trim() || PRODUCTION_URL.trim();

const config: CapacitorConfig = {
  appId: "id.businessflow.app",
  appName: "Business Flow",
  webDir: "public",
  server: serverUrl ? { url: serverUrl, cleartext: false } : undefined,
  android: { allowMixedContent: false },
};

export default config;
