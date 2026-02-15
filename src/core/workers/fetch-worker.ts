import { Job } from "bullmq";
import { createQueue, createWorker, QUEUE_NAMES } from "../../lib/queue";
import axios from "axios";
import fs from "fs/promises";
import crypto from "crypto";
import path from "path";

interface FetchJobData {
  url: string;
}

// 1. Setup the "Output" Queue
const parseQueue = createQueue(QUEUE_NAMES.PARSE);

// 2. Define the "Fetcher" Logic
const fetchProcessor = async (job: Job<FetchJobData>) => {
  const { url } = job.data;
  console.log(`[FETCH] Downloading... ${url}`);

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": "Moxcety-Bot/1.0" },
    });

    // get the html response and save it in storage folder to simulate aws s3 like behavior
    const filename =
      crypto.createHash("md5").update(url).digest("hex") + ".html";
    const filePath = path.join(process.cwd(), "storage", filename);

    await fs.mkdir(path.dirname(filePath), { recursive: true });

    const fileContent =
      typeof response.data === "string"
        ? response.data
        : JSON.stringify(response.data);
    await fs.writeFile(filePath, fileContent);

    // add to parse queue
    await parseQueue.add("parse-job", {
      url: url,
      filePath: filePath,
    });

    console.log(` [FETCH] Saved to ${filename}`);
  } catch (error) {
    console.error(
      `❌ [Fetch] Failed ${url}:`,
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
};

export const fetchWorker = createWorker(
  QUEUE_NAMES.FRONTIER,
  fetchProcessor,
  50,
);
