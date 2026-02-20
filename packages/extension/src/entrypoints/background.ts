import type { CreateResourceInput } from "@trove/shared";
import { saveResource } from "@/utils/api";

export default defineBackground(() => {
  // Listen for keyboard shortcut command
  browser.commands.onCommand.addListener(async (command) => {
    if (command !== "save-page") return;

    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id || !tab.url) return;

    // Skip browser internal pages
    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("about:") ||
      tab.url.startsWith("moz-extension://") ||
      tab.url.startsWith("chrome-extension://")
    ) {
      return;
    }

    await savePage(tab.id, tab.url, tab.title ?? null);
  });

  // Listen for messages from popup
  browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    const msg = message as { type?: string };
    if (msg.type === "save-current-page") {
      handleSaveFromPopup().then(sendResponse);
    }
    return true; // keep channel open for async response
  });
});

async function handleSaveFromPopup() {
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (!tab?.id || !tab.url) {
    return { ok: false, error: "No active tab found." };
  }

  if (
    tab.url.startsWith("chrome://") ||
    tab.url.startsWith("about:") ||
    tab.url.startsWith("moz-extension://") ||
    tab.url.startsWith("chrome-extension://")
  ) {
    return { ok: false, error: "Cannot save browser internal pages." };
  }

  return savePage(tab.id, tab.url, tab.title ?? null);
}

async function savePage(tabId: number, pageUrl: string, pageTitle: string | null) {
  // Extract metadata from the page via scripting API
  let metadata: PageMetadata = {
    title: pageTitle,
    description: null,
    ogImage: null,
  };

  try {
    const results = await browser.scripting.executeScript({
      target: { tabId },
      func: extractPageMetadata,
    });
    if (results?.[0]?.result) {
      metadata = results[0].result as PageMetadata;
    }
  } catch {
    // Scripting may fail on some pages — fall back to tab title
  }

  // Try to get geolocation (may fail if not permitted)
  let latitude: number | undefined;
  let longitude: number | undefined;
  try {
    const pos = await getGeolocation();
    latitude = pos.latitude;
    longitude = pos.longitude;
  } catch {
    // Geolocation not available — proceed without it
  }

  const input: CreateResourceInput = {
    url: pageUrl,
    source: "extension",
    title: metadata.title || undefined,
    description: metadata.description || undefined,
    latitude,
    longitude,
    metadata: metadata.ogImage ? { og_image: metadata.ogImage } : undefined,
  };

  return saveResource(input);
}

interface PageMetadata {
  title: string | null;
  description: string | null;
  ogImage: string | null;
}

/** Injected into the page to extract metadata — runs in page context */
function extractPageMetadata(): PageMetadata {
  const getMeta = (selectors: string[]): string | null => {
    for (const selector of selectors) {
      const el = document.querySelector<HTMLMetaElement>(selector);
      if (el?.content) return el.content;
    }
    return null;
  };

  return {
    title:
      getMeta(['meta[property="og:title"]', 'meta[name="twitter:title"]']) ||
      document.title ||
      null,
    description: getMeta([
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      'meta[name="description"]',
    ]),
    ogImage: getMeta([
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
    ]),
  };
}

function getGeolocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => reject(err),
      { timeout: 5000, maximumAge: 60000 },
    );
  });
}
