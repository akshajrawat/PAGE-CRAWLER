// src/utils/url_filter.ts

const BLACKLISTED_DOMAINS = [
  'wikipedia.org', 'facebook.com', 'twitter.com', 'x.com', 
  'instagram.com', 'reddit.com', 'amazon.com', 'pinterest.com',
  'youtube.com', 'linkedin.com', 'github.com', 'npm.im', 'npmjs.com'
];

const BLACKLISTED_EXTENSIONS = [
  '.pdf', '.jpg', '.png', '.gif', '.mp4', '.zip', '.exe', '.csv', '.json', '.xml', '.svg'
];

/**
 * Checks if a normalized URL passes the crawler's business rules.
 */
export function isAllowedForCrawl(normalizedUrl: string): boolean {
  try {
    const urlObj = new URL(normalizedUrl);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();

    // 1. Check Domain Blacklist
    const isBlacklistedDomain = BLACKLISTED_DOMAINS.some(d => hostname.includes(d));
    if (isBlacklistedDomain) return false;

    // 2. Check Extension Blacklist
    const isBlacklistedExt = BLACKLISTED_EXTENSIONS.some(ext => pathname.endsWith(ext));
    if (isBlacklistedExt) return false;

    return true; // Passed all checks
  } catch (error) {
    return false; // If we can't parse it, don't crawl it
  }
}