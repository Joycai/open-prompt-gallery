function parseOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function hasValidRequestOrigin(
  request: Request,
  configuredOrigin = process.env.APP_ORIGIN,
): boolean {
  const origin = parseOrigin(request.headers.get("origin"));
  if (!origin) return false;

  // Browsers set this forbidden header from the actual request destination,
  // even when a reverse proxy changes the host or scheme seen by Next.js.
  const site = request.headers.get("sec-fetch-site");
  if (site === "same-origin") return true;
  if (site !== null) return false;

  // HTTP LAN browsers may omit Fetch Metadata. Use the preserved Host header
  // because request.url can contain the internal container/listener hostname.
  const url = new URL(request.url);
  const host = request.headers.get("host");
  const requestOrigin = host
    ? parseOrigin(`${url.protocol}//${host}`)
    : url.origin;
  return (
    origin === requestOrigin || origin === parseOrigin(configuredOrigin ?? null)
  );
}
