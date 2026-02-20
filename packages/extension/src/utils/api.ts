import type { CreateResourceInput, Resource } from "@trove/shared";
import { getSettings } from "./storage";

export interface SaveResult {
  ok: true;
  resource: Resource;
}

export interface SaveError {
  ok: false;
  error: string;
}

export async function saveResource(
  input: CreateResourceInput,
): Promise<SaveResult | SaveError> {
  const { apiUrl, apiKey } = await getSettings();

  if (!apiUrl || !apiKey) {
    return { ok: false, error: "API URL and API key must be configured. Open the extension popup to set them." };
  }

  const url = apiUrl.replace(/\/+$/, "") + "/resources";

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(input),
    });
  } catch (e) {
    return { ok: false, error: `Network error: ${e instanceof Error ? e.message : String(e)}` };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 409) {
      return { ok: false, error: "This URL has already been saved." };
    }
    return { ok: false, error: `API error (${res.status}): ${body || res.statusText}` };
  }

  const resource: Resource = await res.json();
  return { ok: true, resource };
}
