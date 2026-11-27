export function normalizeLinkUrl(value: string): string | null {
  const raw = value.trim();
  if (raw.length > 2_048 || /[\s\\\p{Cc}]/u.test(raw)) return null;

  const explicitScheme = /^https?:\/\//iu.test(raw);
  const authority = raw.split(/[/?#]/u, 1)[0];
  if (!explicitScheme && !/^[^:@]+\.[^:@]+(?::\d+)?$/u.test(authority)) return null;

  try {
    const url = new URL(explicitScheme ? raw : `https://${raw}`);
    if (url.username || url.password || url.href.length > 2_048) return null;
    return url.href;
  } catch {
    return null;
  }
}
