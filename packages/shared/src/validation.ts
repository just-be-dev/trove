import type { CreateResourceInput, ResourceSource } from "./types.js";

const VALID_SOURCES: ResourceSource[] = ["github_star", "extension", "ios_shortcut", "manual"];

/** Validate a URL string */
function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/** Validation error with field-level details */
export interface ValidationError {
  field: string;
  message: string;
}

/** Validation result */
export type ValidationResult =
  | { ok: true; data: CreateResourceInput }
  | { ok: false; errors: ValidationError[] };

/** Validate a CreateResourceInput */
export function validateCreateResource(input: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: [{ field: "body", message: "Request body must be a JSON object" }] };
  }

  const obj = input as Record<string, unknown>;

  // Required: url
  if (typeof obj.url !== "string" || !obj.url.trim()) {
    errors.push({ field: "url", message: "url is required and must be a non-empty string" });
  } else if (!isValidUrl(obj.url)) {
    errors.push({ field: "url", message: "url must be a valid URL" });
  }

  // Required: source
  if (typeof obj.source !== "string" || !VALID_SOURCES.includes(obj.source as ResourceSource)) {
    errors.push({ field: "source", message: `source must be one of: ${VALID_SOURCES.join(", ")}` });
  }

  // Optional strings
  for (const field of ["title", "description", "source_id", "author", "notes"] as const) {
    if (obj[field] !== undefined && typeof obj[field] !== "string") {
      errors.push({ field, message: `${field} must be a string` });
    }
  }

  // Optional: tags
  if (obj.tags !== undefined) {
    if (!Array.isArray(obj.tags) || !obj.tags.every((t) => typeof t === "string")) {
      errors.push({ field: "tags", message: "tags must be an array of strings" });
    }
  }

  // Optional: latitude / longitude
  for (const field of ["latitude", "longitude"] as const) {
    if (obj[field] !== undefined && typeof obj[field] !== "number") {
      errors.push({ field, message: `${field} must be a number` });
    }
  }

  // Optional: metadata
  if (obj.metadata !== undefined && (typeof obj.metadata !== "object" || obj.metadata === null || Array.isArray(obj.metadata))) {
    errors.push({ field: "metadata", message: "metadata must be a JSON object" });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      url: obj.url as string,
      source: obj.source as ResourceSource,
      title: obj.title as string | undefined,
      description: obj.description as string | undefined,
      source_id: obj.source_id as string | undefined,
      author: obj.author as string | undefined,
      tags: obj.tags as string[] | undefined,
      notes: obj.notes as string | undefined,
      latitude: obj.latitude as number | undefined,
      longitude: obj.longitude as number | undefined,
      metadata: obj.metadata as Record<string, unknown> | undefined,
    },
  };
}
