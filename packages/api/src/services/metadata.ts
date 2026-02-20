const MAX_BODY_BYTES = 64 * 1024; // 64 KB

/** Fetch page title and description from a URL */
export async function fetchUrlMetadata(
  url: string
): Promise<{ title: string | null; description: string | null }> {
  try {
    // SSRF: only allow http/https schemes
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { title: null, description: null };
    }

    const response = await fetch(url, {
      headers: { "User-Agent": "Trove/1.0 (metadata fetcher)" },
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { title: null, description: null };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return { title: null, description: null };
    }

    // Limit body size to prevent DoS
    const reader = response.body?.getReader();
    if (!reader) {
      return { title: null, description: null };
    }
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        reader.cancel();
        break;
      }
      chunks.push(value);
    }
    const html = new TextDecoder().decode(
      chunks.reduce((acc, chunk) => {
        const merged = new Uint8Array(acc.byteLength + chunk.byteLength);
        merged.set(acc);
        merged.set(chunk, acc.byteLength);
        return merged;
      }, new Uint8Array(0))
    );
    const title = extractTitle(html);
    const description = extractMetaDescription(html);

    return { title, description };
  } catch {
    return { title: null, description: null };
  }
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeEntities(match[1].trim()) : null;
}

function extractMetaDescription(html: string): string | null {
  // Try og:description first, then standard meta description
  const ogMatch = html.match(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i
  ) ?? html.match(
    /<meta[^>]+content=["']([\s\S]*?)["'][^>]+property=["']og:description["'][^>]*>/i
  );
  if (ogMatch) return decodeEntities(ogMatch[1].trim());

  const metaMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i
  ) ?? html.match(
    /<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["'][^>]*>/i
  );
  return metaMatch ? decodeEntities(metaMatch[1].trim()) : null;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}
