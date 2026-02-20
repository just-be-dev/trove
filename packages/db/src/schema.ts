import { sqliteTable, text, integer, real, uniqueIndex, index, primaryKey } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

/** Resources table — the core entity for saved web resources */
export const resources = sqliteTable(
  "resources",
  {
    id: text("id").primaryKey(),
    url: text("url").notNull(),
    title: text("title"),
    description: text("description"),
    source: text("source", { enum: ["github_star", "extension", "ios_shortcut", "manual"] }).notNull(),
    source_id: text("source_id"),
    author: text("author"),
    tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
    notes: text("notes"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("resources_url_idx").on(table.url),
    index("resources_source_idx").on(table.source),
    index("resources_created_at_idx").on(table.created_at),
  ]
);

/** Resource authors — normalized author tracking across platforms */
export const resourceAuthors = sqliteTable(
  "resource_authors",
  {
    id: text("id").primaryKey(),
    platform: text("platform").notNull(),
    username: text("username").notNull(),
    display_name: text("display_name"),
    profile_url: text("profile_url"),
    resource_count: integer("resource_count").notNull().default(0),
    created_at: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("authors_platform_username_idx").on(table.platform, table.username),
  ]
);

/** Join table linking resources to authors */
export const resourceAuthorMap = sqliteTable(
  "resource_author_map",
  {
    resource_id: text("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    author_id: text("author_id")
      .notNull()
      .references(() => resourceAuthors.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.resource_id, table.author_id] }),
    index("map_resource_id_idx").on(table.resource_id),
    index("map_author_id_idx").on(table.author_id),
  ]
);

// --- Relations ---

export const resourcesRelations = relations(resources, ({ many }) => ({
  authorLinks: many(resourceAuthorMap),
}));

export const resourceAuthorsRelations = relations(resourceAuthors, ({ many }) => ({
  resourceLinks: many(resourceAuthorMap),
}));

export const resourceAuthorMapRelations = relations(resourceAuthorMap, ({ one }) => ({
  resource: one(resources, {
    fields: [resourceAuthorMap.resource_id],
    references: [resources.id],
  }),
  author: one(resourceAuthors, {
    fields: [resourceAuthorMap.author_id],
    references: [resourceAuthors.id],
  }),
}));
