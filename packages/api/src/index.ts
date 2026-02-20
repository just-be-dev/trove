import { Hono } from "hono";
import { createDb } from "@trove/db";
import type { Bindings, Variables } from "./types.js";
import { apiKeyAuth } from "./middleware/auth.js";
import { resources } from "./routes/resources.js";
import { webhooks } from "./routes/webhooks.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Inject DB client into context for all routes
app.use("*", async (c, next) => {
  c.set("db", createDb(c.env.DB));
  await next();
});

// Webhook routes — authenticated via HMAC signature, not API key
app.route("/webhooks", webhooks);

// Resource routes — protected by API key
app.use("/resources/*", apiKeyAuth);
app.route("/resources", resources);

// Health check
app.get("/", (c) => c.json({ name: "trove-api", status: "ok" }));

export default app;
