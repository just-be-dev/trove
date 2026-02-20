import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema.js";

export * from "./schema.js";
export * from "./queries.js";

export type DbClient = ReturnType<typeof createDb>;

/** Create a typed Drizzle instance bound to a D1 database */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
