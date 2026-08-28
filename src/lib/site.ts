/** Normalize a site URL and derive a display brand from the hostname. */
export function parseSiteUrl(input: string): { url: string; brand: string } {
  const raw = input.trim();
  if (!raw) throw new Error("Site URL is required");

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error("Enter a valid site URL");
  }

  if (!parsed.hostname || !parsed.hostname.includes(".")) {
    throw new Error("Enter a valid site URL");
  }

  const host = parsed.hostname.replace(/^www\./i, "");
  const label = host.split(".")[0] || host;
  const brand =
    label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();

  return {
    url: `https://${host}${parsed.pathname === "/" ? "" : parsed.pathname}`.replace(
      /\/$/,
      "",
    ),
    brand,
  };
}
