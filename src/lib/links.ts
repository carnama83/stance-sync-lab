import { safeExternalHref } from "./sanitize";

export type SourceLink = { url: string; title?: string; source?: string };

export function toSourceLinks(input: unknown): SourceLink[] {
  const out: SourceLink[] = [];

  const pushIfValid = (obj: any) => {
    if (!obj) return;
    // support strings or objects
    const href = safeExternalHref(typeof obj === "string" ? obj : obj.url);
    if (!href) return;
    out.push({
      url: href,
      title: (typeof obj === "object" && typeof obj.title === "string" && obj.title.trim()) || undefined,
      source: (typeof obj === "object" && typeof obj.source === "string" && obj.source.trim()) || undefined,
    });
  };

  if (Array.isArray(input)) {
    input.forEach(pushIfValid);
  } else if (typeof input === "object" && input !== null) {
    // single object case: { url, title, source }
    pushIfValid(input);
  } else if (typeof input === "string") {
    pushIfValid(input);
  }

  // de-duplicate by URL
  const seen = new Set<string>();
  return out.filter((l) => (seen.has(l.url) ? false : (seen.add(l.url), true)));
}