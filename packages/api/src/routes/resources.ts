import { Hono } from "hono";
import {
  insertResource,
  getResources,
  getResourceById,
  deleteResource,
} from "@trove/db";
import { validateCreateResource } from "@trove/shared";
import type { Bindings, Variables } from "../types.js";
import { fetchUrlMetadata } from "../services/metadata.js";

const resources = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/** POST /resources — Create a resource */
resources.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const result = validateCreateResource(body);
  if (!result.ok) {
    return c.json({ error: "Validation failed", details: result.errors }, 400);
  }

  const input = result.data;

  // If title or description is missing, try to fetch from URL
  if (!input.title || !input.description) {
    const meta = await fetchUrlMetadata(input.url);
    if (!input.title && meta.title) input.title = meta.title;
    if (!input.description && meta.description) input.description = meta.description;
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const db = c.get("db");
  try {
    await insertResource(db, {
      id,
      url: input.url,
      title: input.title ?? null,
      description: input.description ?? null,
      source: input.source,
      source_id: input.source_id ?? null,
      author: input.author ?? null,
      tags: input.tags,
      notes: input.notes ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      metadata: input.metadata ?? null,
      created_at: now,
      updated_at: now,
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("UNIQUE constraint failed")) {
      return c.json({ error: "Resource with this URL already exists" }, 409);
    }
    throw err;
  }

  const resource = await getResourceById(db, id);
  return c.json(resource, 201);
});

/** GET /resources — List resources (paginated, filterable) */
resources.get("/", async (c) => {
  const validSources = ["github_star", "extension", "ios_shortcut", "manual"] as const;
  const sourceParam = c.req.query("source");
  if (sourceParam !== undefined && !validSources.includes(sourceParam as typeof validSources[number])) {
    return c.json({ error: `Invalid source. Must be one of: ${validSources.join(", ")}` }, 400);
  }
  const source = sourceParam as typeof validSources[number] | undefined;
  const cursor = c.req.query("cursor");
  const limitStr = c.req.query("limit");
  const limit = limitStr ? parseInt(limitStr, 10) : undefined;

  if (limit !== undefined && (isNaN(limit) || limit < 1 || limit > 100)) {
    return c.json({ error: "limit must be between 1 and 100" }, 400);
  }

  const db = c.get("db");
  const result = await getResources(db, { source, cursor, limit });
  return c.json(result);
});

/** GET /resources/:id — Get a single resource */
resources.get("/:id", async (c) => {
  const db = c.get("db");
  const resource = await getResourceById(db, c.req.param("id"));
  if (!resource) {
    return c.json({ error: "Resource not found" }, 404);
  }
  return c.json(resource);
});

/** DELETE /resources/:id — Delete a resource */
resources.delete("/:id", async (c) => {
  const db = c.get("db");
  const resource = await getResourceById(db, c.req.param("id"));
  if (!resource) {
    return c.json({ error: "Resource not found" }, 404);
  }

  await deleteResource(db, c.req.param("id"));
  return c.json({ ok: true });
});

export { resources };
