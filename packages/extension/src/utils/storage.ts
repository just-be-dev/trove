import { storage } from "wxt/storage";

/** Stored API URL (defaults to empty — must be configured by user) */
export const apiUrl = storage.defineItem<string>("local:apiUrl", {
  fallback: "",
});

/** Stored API key for Bearer auth */
export const apiKey = storage.defineItem<string>("local:apiKey", {
  fallback: "",
});

export interface Settings {
  apiUrl: string;
  apiKey: string;
}

export async function getSettings(): Promise<Settings> {
  const [url, key] = await Promise.all([apiUrl.getValue(), apiKey.getValue()]);
  return { apiUrl: url, apiKey: key };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await Promise.all([
    apiUrl.setValue(settings.apiUrl),
    apiKey.setValue(settings.apiKey),
  ]);
}
