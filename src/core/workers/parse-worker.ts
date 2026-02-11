import { Job } from "bullmq";
import fs from "fs/promises";
import { createQueue, createWorker, QUEUE_NAMES } from "../../lib/queue";
import * as cheerio from "cheerio";
import { getNormalizedUrl } from "../../utils/normalize_url";
import { savePageData } from "../../db/db";
import { addUrlToFrontier } from "../../services/feeder/frontier-feed";

interface parseJobData {
  url: string;
  filePath: string;
}

// the processor
const parseProcessor = async (job: Job<parseJobData>) => {
  const { url, filePath } = job.data;
  console.log(` [PARSE] Processing: ${url}`);

  try {
    const html = await fs.readFile(filePath, "utf-8");
    const $ = cheerio.load(html);

    // title
    const title = $("title").text().trim() || url;

    // extract links
    const links: string[] = [];
    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        const validUrl = getNormalizedUrl(href);
        if (validUrl) {
          links.push(validUrl);
        }
      }
    });

    // extract code snippets
    const codeSnippets: { language: string; content: string }[] = [];
    $("pre").each((_, el) => {
      const $el = $(el);
      const $code = $el.find("code");
      const content = $(el).text().trim();
      if (content.length < 10) {
        return;
      }

      // guess language
      let language = "text";
      const dataLang = $el.attr("data-language") || $code.attr("data-language");
      const className = $el.attr("class") || $code.attr("class") || "";
      const classMatch = className.match(/(?:language|lang)-(\w+)/);

      if (dataLang) {
        language = dataLang;
      } else if (classMatch) {
        language = classMatch[1];
      }

      // add to codeSnippets
      codeSnippets.push({ language, content });
    });

    console.log("💕💕💕💕💕💕💕💕💕💕💕found code" + codeSnippets.length);

    // add data to postgresql table
    await savePageData(url, {
      title: title,
      links: links,
      codeSnippets: codeSnippets,
    });

    // add to frontier queue to continue the infinite loop
    const result = await Promise.allSettled(
      links.map((link) => addUrlToFrontier(link)),
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

export const parseWorker = createWorker(QUEUE_NAMES.PARSE, parseProcessor);

console.log(" Parse Worker Started! Waiting for HTML files...");
