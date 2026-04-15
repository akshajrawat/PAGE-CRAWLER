import Redis from "ioredis";
import dotenv from "dotenv";
import robotsParser from "robots-parser";

dotenv.config();

// Create the connection
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

export class PolitenessGuard {
  private static userAgent = "MoxcetyBot";

  // The Atomic Lua Script: Locks the domain for X milliseconds
  private static rateLimitScript = `
    local key = KEYS[1]
    local delay_ms = tonumber(ARGV[1])
    
    if redis.call("EXISTS", key) == 1 then
      return 0 -- Locked!
    else
      redis.call("SET", key, "locked", "PX", delay_ms)
      return 1 -- Approved and newly locked.
    end
  `;

  //  This function fetch the robot.txt file for the domain and saves it in a cache type memory for a short period (24hr).... We need to follow robot.txt..
  // if the robots.txt is not present in the cache it fetches it but has a safety net and abort the process within 3 sec if no response is gotten
  private static async checkRobotsTxt(targetUrl: URL): Promise<boolean> {
    const domain = targetUrl.hostname;
    const robotsKey = `robots:${domain}`;

    let robotsContent = await redis.get(robotsKey);

    if (!robotsContent) {
      try {
        const robotsUrl = `${targetUrl.protocol}//${domain}/robots.txt`;
        // We use a quick fetch with a 3-second timeout so it doesn't hang
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(robotsUrl, {
          headers: { "User-Agent": this.userAgent },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          robotsContent = await response.text();
        } else {
          robotsContent = "Allow: /";
        }
        // Cache for 24 hours
        await redis.set(robotsKey, robotsContent, "EX", 86400);
      } catch (error) {
        return true;
      }
    }
    const robotsUrl = `${targetUrl.protocol}//${domain}/robots.txt`;
    const parser = robotsParser(robotsUrl, robotsContent);
    return parser.isAllowed(targetUrl.href, this.userAgent) ?? true;
  }

//   checks whether you can crawl the url or not
// first checks the robots.txt using the above function, if not allowed returns false  
//  then runs the lua script , if the url is already taken no crawl, if not crawl 
  static async canCrawl(url: string): Promise<boolean> {
    const targetUrl = new URL(url);
    const domain = targetUrl.hostname;

    // Robots.txt Compliance Check
    const isAllowed = await this.checkRobotsTxt(targetUrl);
    if (!isAllowed) {
      console.log(`🛑 [Politeness] Blocked by robots.txt: ${url}`);
      return false;
    }

    // Distributed Rate Limit (Lock domain for 2000 milliseconds)
    const delayMs = 2000;
    const domainLockKey = `ratelimit:${domain}`;

    const result = await redis.eval(
      this.rateLimitScript,
      1,
      domainLockKey,
      delayMs,
    );

    if (result === 0) return false; // not clear!!
    return true; // Cleared to fetch
  }
}
