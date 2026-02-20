import type { DbClient } from "@trove/db";

/** Cloudflare Worker environment bindings */
export interface Bindings {
  DB: D1Database;
  API_KEY: string;
  GITHUB_WEBHOOK_SECRET: string;
}

/** Hono variables available on context */
export interface Variables {
  db: DbClient;
}
