/** Resource source types */
export type ResourceSource = "github_star" | "extension" | "ios_shortcut" | "manual";

/** Core resource type matching the D1 schema */
export interface Resource {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  source: ResourceSource;
  source_id: string | null;
  author: string | null;
  tags: string[];
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/** Input for creating a resource (from extension / iOS shortcut) */
export interface CreateResourceInput {
  url: string;
  title?: string;
  description?: string;
  source: ResourceSource;
  source_id?: string;
  author?: string;
  tags?: string[];
  notes?: string;
  latitude?: number;
  longitude?: number;
  metadata?: Record<string, unknown>;
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  data: T[];
  cursor: string | null;
  has_more: boolean;
}

/** Query parameters for listing resources */
export interface ListResourcesParams {
  source?: ResourceSource;
  cursor?: string;
  limit?: number;
}

/** Resource author (normalized across platforms) */
export interface ResourceAuthor {
  id: string;
  platform: string;
  username: string;
  display_name: string | null;
  profile_url: string | null;
  resource_count: number;
  created_at: string;
}
