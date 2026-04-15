/**
 * Normalize the url so there are no duplicate in the database
 * @param urlString
 * @param baseUrl
 * @returns NORMALIZED URL
 */

export function getNormalizedUrl(
  urlString: string,
  baseUrl?: string,
): string | null {
  try {
    const urlObj = baseUrl ? new URL(urlString, baseUrl) : new URL(urlString);

    const protocol = urlObj.protocol.toLowerCase();
    const host = urlObj.hostname.toLowerCase();

    // Filter out non-web protocols (e.g., mailto:, tel:, javascript:)
    if (!protocol.startsWith("http")) {
      return null;
    }

    let path = urlObj.pathname;
    if (path.endsWith("/")) {
      path = path.slice(0, -1);
    }

    // Remove fragments (#)
    urlObj.hash = "";

    // Strip tracking parameters, but keep content parameters (like ?id=123)
    const trackingParams = [
      "utm_source", "utm_medium", "utm_campaign", 
      "utm_term", "utm_content", "ref", "source", "affiliate"
    ];
    trackingParams.forEach(param => urlObj.searchParams.delete(param));

    // re-construct the search
    const search = urlObj.search;

    return `${protocol}//${host}${path}${search}`;
  } catch (error) {
    return null;
  }
}
