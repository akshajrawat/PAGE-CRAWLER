import { Job } from "bullmq";
import fs from "fs/promises";
import { createWorker, QUEUE_NAMES } from "../../lib/queue";
import * as cheerio from "cheerio";
import { getNormalizedUrl } from "../../utils/normalize_url";
import { savePageData } from "../../db/db";
import { addUrlToFrontier } from "../../services/feeder/frontier-feed";
import { isAllowedForCrawl } from "../../utils/url_filter";

interface parseJobData {
  url: string;
  filePath: string;
  depth?: number;
}

// guess the language
const detectLanguage = (content: string, hint: string = ""): string => {
  if (hint && !hint.includes("text")) return hint;

  if (
    content.includes("import React") ||
    content.includes("useState") ||
    content.includes("export default")
  )
    return "javascript";
  if (
    content.includes("def ") &&
    content.includes("return") &&
    content.includes("self")
  )
    return "python";
  if (
    content.includes("public class") ||
    content.includes("System.out.println")
  )
    return "java";
  if (
    content.includes("npm install") ||
    content.includes("yarn add") ||
    content.includes("npx")
  )
    return "bash";
  if (content.includes("<div") || content.includes("</")) return "jsx";

  return "text"; // Fallback
};

// the processor
const parseProcessor = async (job: Job<parseJobData>) => {
  const { url, filePath, depth = 0 } = job.data;
  const MAX_DEPTH = 3; // SAFETY DEPTH

  console.log(` [PARSE] Processing: ${url}`);

  try {
    const html = await fs.readFile(filePath, "utf-8");
    const $ = cheerio.load(html);

    // title
    const title = $("title").text().trim() || url;

    // description
    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="twitter:description"]').attr("content") ||
      "";

    // body content
    const $body = $("body").clone();
    $body.find("script, style, noscript, iframe, svg, nav, footer").remove();

    // Collapse whitespace: "Hello    World" -> "Hello World"
    // Limit to 100k chars to prevent Postgres issues with massive pages
    const body_text = $body.text().replace(/\s+/g, " ").trim().slice(0, 100000);

    // extract links
    const links: string[] = [];

    if (depth < MAX_DEPTH) {
      $("a").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        try {
          const absoluteUrl = new URL(href, url).toString();
          const validUrl = getNormalizedUrl(absoluteUrl);

          if (validUrl) {
            const isAllowed = isAllowedForCrawl(validUrl);

            // Remove duplicates from same page from the same page
            if (isAllowed && !links.includes(validUrl)) {
              links.push(validUrl);
            }
          }
        } catch (error) {
          // Ignore invalid URL structures without crashing
        }
      });
    } else {
      console.log(
        `[PARSE] 🛑 Max Depth (${MAX_DEPTH}) Reached. Stopping outward crawl.`,
      );
    }

    // extract code snippets
    const codeSnippets: { language: string; content: string }[] = [];

    $("pre").each((_, el) => {
      const $el = $(el);
      const $code = $el.find("code");

      // 1️ : PICK THE RIGHT TARGET: Prefer <code> inside <pre>, otherwise use <pre>
      const $target = $code.length ? $code : $el;

      // 2️ : CLONE IT: We don't want to break the original HTML structure for other extractors
      const $clone = $target.clone();

      // 3️ : INJECT NEWLINES: Replace <br> and closing block tags with \n
      $clone.find("br").replaceWith("\n");
      $clone.find("div, p, li, tr").after("\n");

      // 4️ : EXTRACT: Now .text() will see the \n characters we injected
      let content = $clone.text().trim();

      if (content.length < 10) {
        return;
      }

      // guess language (Same as before)
      const dataLang = $el.attr("data-language") || $code.attr("data-language");
      const className = $el.attr("class") || $code.attr("class") || "";
      const classMatch = className.match(/(?:language|lang)-(\w+)/);
      const htmlHint = dataLang || (classMatch ? classMatch[1] : "");

      // USE DETECTOR
      const language = detectLanguage(content, htmlHint);

      // add to codeSnippets
      codeSnippets.push({ language, content });
    });

    console.log("✅found code >>> " + codeSnippets.length);

    // add data to postgresql table
    await savePageData(url, {
      title: title,
      description: description.slice(0, 500),
      body_text: body_text,
      links: links,
      codeSnippets: codeSnippets,
    });

    // add to frontier queue to continue the infinite loop
    const result = await Promise.allSettled(
      links.map((link) => addUrlToFrontier(link, depth + 1)),
    );
    const newLinkCount: number = result.filter((r) => {
      return r.status === "fulfilled";
    }).length;

    // after everything is done clear the html in storage to save space
    await fs.unlink(filePath);

    console.log(
      `✅ [PARSE] Finished ${url}. Found ${newLinkCount} links, ${codeSnippets.length} snippets.`,
    );
  } catch (error) {
    console.error(`❌ [PARSE] Failed ${url}:`, error);
    throw error;
  }
};

export const parseWorker = createWorker(QUEUE_NAMES.PARSE, parseProcessor, 10);

console.log(" Parse Worker Started! Waiting for HTML files...");
