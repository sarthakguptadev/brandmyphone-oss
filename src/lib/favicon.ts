/** High-res favicon URL for a site (used as the on-phone sticker). */
export function faviconUrlFor(input: string, size = 256): string {
  try {
    const url = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    const hostname = new URL(url).hostname.replace(/^www\./i, "");
    if (!hostname) return "";
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=${size}`;
  } catch {
    return "";
  }
}
