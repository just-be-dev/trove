import { Hono } from "hono";
import {
  insertResource,
  upsertAuthor,
  linkAuthorToResource,
} from "@trove/db";
import type { Bindings, Variables } from "../types.js";
import { verifyGitHubSignature } from "../middleware/auth.js";
import { parseStarEvent } from "../services/github.js";

const webhooks = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/** POST /webhooks/github — Receives GitHub star events */
webhooks.post("/github", async (c) => {
  const signature = c.req.header("X-Hub-Signature-256");
  if (!signature) {
    return c.json({ error: "Missing signature header" }, 401);
  }

  const rawBody = await c.req.text();

  const valid = await verifyGitHubSignature(
    c.env.GITHUB_WEBHOOK_SECRET,
    rawBody,
    signature
  );
  if (!valid) {
    return c.json({ error: "Invalid signature" }, 403);
  }

  const event = c.req.header("X-GitHub-Event");
  if (event !== "star") {
    // Not a star event — acknowledge but ignore
    return c.json({ ok: true, message: `Ignored event: ${event}` });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return c.json({ error: "Malformed JSON body" }, 400);
  }
  const starData = parseStarEvent(payload);
  if (!starData) {
    // action !== "created" or missing repo — ignore
    return c.json({ ok: true, message: "Ignored (not a star creation)" });
  }

  const db = c.get("db");
  const now = new Date().toISOString();
  const resourceId = crypto.randomUUID();

  try {
    await insertResource(db, {
      id: resourceId,
      url: starData.url,
      title: starData.title,
      description: starData.description,
      source: "github_star",
      source_id: starData.source_id,
      author: starData.author,
      tags: starData.topics,
      notes: null,
      latitude: null,
      longitude: null,
      metadata: {
        language: starData.language,
        stars: starData.stars,
      },
      created_at: now,
      updated_at: now,
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("UNIQUE constraint failed")) {
      return c.json({ error: "Resource with this URL already exists" }, 409);
    }
    throw err;
  }

  // Upsert the author and link to the resource
  if (starData.author) {
    const author = await upsertAuthor(db, {
      id: crypto.randomUUID(),
      platform: "github",
      username: starData.author,
      profile_url: starData.authorUrl,
      created_at: now,
    });
    if (author) {
      await linkAuthorToResource(db, resourceId, author.id);
    }
  }

  return c.json({ ok: true, resource_id: resourceId }, 201);
});

export { webhooks };
