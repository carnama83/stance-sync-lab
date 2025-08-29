export function safeExternalHref(raw: unknown): string | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    const u = new URL(raw);
    // allow only http/https
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
    return null;
  } catch {
    return null;
  }
}