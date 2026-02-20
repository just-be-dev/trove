import { eq, desc, and, lt, sql } from "drizzle-orm";
import type { DbClient } from "./index.js";
import { resources, resourceAuthors, resourceAuthorMap } from "./schema.js";
import type { ResourceSource } from "@trove/shared";

/** Insert a new resource */
export async function insertResource(
  db: DbClient,
  data: {
    id: string;
    url: string;
    title?: string | null;
    description?: string | null;
    source: ResourceSource;
    source_id?: string | null;
    author?: string | null;
    tags?: string[];
    notes?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    metadata?: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
  }
) {
  return db.insert(resources).values({
    id: data.id,
    url: data.url,
    title: data.title ?? null,
    description: data.description ?? null,
    source: data.source,
    source_id: data.source_id ?? null,
    author: data.author ?? null,
    tags: data.tags ?? [],
    notes: data.notes ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    metadata: data.metadata ?? null,
    created_at: data.created_at,
    updated_at: data.updated_at,
  });
}

/** Get resources with cursor-based pagination */
export async function getResources(
  db: DbClient,
  opts: {
    source?: ResourceSource;
    cursor?: string;
    limit?: number;
  } = {}
) {
  const limit = opts.limit ?? 50;
  const conditions = [];

  if (opts.source) {
    conditions.push(eq(resources.source, opts.source));
  }
  if (opts.cursor) {
    conditions.push(lt(resources.created_at, opts.cursor));
  }

  const rows = await db
    .select()
    .from(resources)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(resources.created_at))
    .limit(limit + 1);

  const has_more = rows.length > limit;
  const data = has_more ? rows.slice(0, limit) : rows;
  const cursor = has_more ? data[data.length - 1].created_at : null;

  return { data, cursor, has_more };
}

/** Get a single resource by ID */
export async function getResourceById(db: DbClient, id: string) {
  const rows = await db
    .select()
    .from(resources)
    .where(eq(resources.id, id))
    .limit(1);

  return rows[0] ?? null;
}

/** Delete a resource by ID */
export async function deleteResource(db: DbClient, id: string) {
  return db.delete(resources).where(eq(resources.id, id));
}

/** Upsert an author — insert or update on conflict (platform + username).
 *  Returns the actual author row (whether newly inserted or existing). */
export async function upsertAuthor(
  db: DbClient,
  data: {
    id: string;
    platform: string;
    username: string;
    display_name?: string | null;
    profile_url?: string | null;
    created_at: string;
  }
) {
  await db
    .insert(resourceAuthors)
    .values({
      id: data.id,
      platform: data.platform,
      username: data.username,
      display_name: data.display_name ?? null,
      profile_url: data.profile_url ?? null,
      resource_count: 1,
      created_at: data.created_at,
    })
    .onConflictDoUpdate({
      target: [resourceAuthors.platform, resourceAuthors.username],
      set: {
        display_name: data.display_name ?? sql`display_name`,
        profile_url: data.profile_url ?? sql`profile_url`,
        resource_count: sql`resource_count + 1`,
      },
    });

  // Fetch the actual row to get the correct ID (may differ from data.id on conflict)
  const rows = await db
    .select()
    .from(resourceAuthors)
    .where(
      and(
        eq(resourceAuthors.platform, data.platform),
        eq(resourceAuthors.username, data.username)
      )
    )
    .limit(1);

  return rows[0];
}

/** Link an author to a resource via the join table */
export async function linkAuthorToResource(
  db: DbClient,
  resourceId: string,
  authorId: string
) {
  return db
    .insert(resourceAuthorMap)
    .values({
      resource_id: resourceId,
      author_id: authorId,
    });
}
