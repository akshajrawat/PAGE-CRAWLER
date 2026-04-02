# 🕸️ Moxcety Core Workers (Distributed Crawler)

This directory contains the decoupled, asynchronous background workers that power the Moxcety Search Engine. The system uses a distributed architecture with **BullMQ (Redis)** to manage the lifecycle of a web page from discovery to database indexing.

## 🏗️ High-Level Architecture Flow



**Workflow Summary:**
1. **Frontier Queue** holds URLs to be visited.

2. **Fetch Worker** downloads the HTML and saves it to local storage.
3. **Parse Queue** receives the file path of the downloaded HTML.
4. **Parse Worker** extracts data, gets AI embeddings, and saves to the Database.
5. **Recursive Loop:** The Parser extracts new links and sends them back to the Frontier Queue (if within depth limits).

---

## ⚙️ The Workers

### 1. The Fetch Worker (`fetch-worker.ts`)
**Role:** The Network Layer & Downloader.
* **Input:** Listens to the `FRONTIER` queue for a `{ url, depth }` payload.

* **Process:** 1. Requests the webpage using `Axios` with a custom `Moxcety-Bot` User-Agent.
    2. Hashes the URL using `MD5` to create a unique, conflict-free filename.
    3. Writes the raw HTML to the local `storage/` directory (simulating an S3 bucket behavior).
* **Output:** Pushes a new job to the `PARSE` queue containing `{ url, filePath, depth }`.

### 2. The Parse Worker (`parse-worker.ts`)
**Role:** The CPU-Heavy Extractor & AI Integrator.
* **Input:** Listens to the `PARSE` queue for a `{ url, filePath, depth }` payload.

* **Process:**
    1. Loads the HTML from disk using `Cheerio`.

    2. **Noise Reduction:** Strips away visual clutter like `<nav>`, `<footer>`, `<script>`, `<style>`, and `<header>`.
    3. **Metadata Extraction:** Grabs the `title` and `description`.
    4. **Code Intelligence:** Scans for `<pre><code>` blocks and autonomously detects the programming language (JS, Python, Java, etc.) using keyword heuristics.
    5. **Database Persistence:** Saves the structured data and code snippets to **Supabase**.
    6. **Cleanup:** Deletes the raw HTML file from disk to prevent storage bloat.
* **Output:** Extracts all `<a>` tags and feeds valid URLs back into the `FRONTIER` queue with an incremented depth (`depth + 1`).

---

## 🛡️ The Open Web Safety Net
To prevent the crawler from infinite-looping or filling the database with "junk" data, the **Parse Worker** enforces three strict rules before adding any new link back to the Frontier:

1. **Max Depth Limit (The Tether):** The crawler starts at Depth 0 (the seed). It will only extract outgoing links if the current page depth is `< MAX_DEPTH` (currently set to `3`). This ensures the crawler stays focused and doesn't wander infinitely far from the seeds.

2. **URL Normalization (The De-duplicator):** Relative URLs are converted to absolute URLs. Fragments (`#section`) and tracking parameters (`?utm_source=...`) are stripped to ensure the same page isn't indexed multiple times.
3. **Global Blacklist (The Shield):** A pre-defined list of massive aggregators (Wikipedia, Reddit, GitHub) and unreadable file extensions (`.pdf`, `.zip`, `.mp4`, `.png`) are strictly ignored to keep the search index clean and developer-focused.