/** Extract resource data from a GitHub star event payload */
export function parseStarEvent(payload: unknown): StarEventData | null {
  if (typeof payload !== "object" || payload === null) return null;

  const event = payload as Record<string, unknown>;
  if (event.action !== "created") return null;

  const repo = event.repository as Record<string, unknown> | undefined;
  if (!repo) return null;

  const sender = event.sender as Record<string, unknown> | undefined;

  return {
    url: repo.html_url as string,
    title: repo.full_name as string,
    description: (repo.description as string) ?? null,
    source_id: repo.full_name as string,
    author: sender?.login as string ?? null,
    authorUrl: sender?.html_url as string ?? null,
    topics: (repo.topics as string[]) ?? [],
    language: (repo.language as string) ?? null,
    stars: (repo.stargazers_count as number) ?? null,
  };
}

export interface StarEventData {
  url: string;
  title: string;
  description: string | null;
  source_id: string;
  author: string | null;
  authorUrl: string | null;
  topics: string[];
  language: string | null;
  stars: number | null;
}
