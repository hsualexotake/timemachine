📄 Product Requirements Document (PRD)
Project Name: Website Archiver
Purpose: Build a lightweight tool that allows users to archive and view snapshots of websites — similar to the Wayback Machine, but simpler and local.

. Goals
Allow users to input a URL and archive the corresponding webpage.

Recursively crawl and archive internal links (on the same domain).

Save the page and all static assets (CSS, JS, images) to local storage.

Let users view previously archived snapshots through a simple UI.

Keep track of multiple versions (timestamps) of a site.



. Tech Stack
Frontend: React + Vite + Tailwind CSS

Backend: Node.js + Express

Parsing: Axios + Cheerio

Storage: Local file system (organized by domain + timestamp)

No database required — use JSON files for metadata



4. Core Features
🧾 Archive Page
Form to input a URL

Submit triggers backend crawl

Backend fetches:

HTML

Linked internal pages (recursive, depth-limited)

Static assets (images, CSS, JS)

Saved as: /archives/domain/timestamp/index.html

🗂 Snapshot Viewer
List of archived domains and timestamps

Click to view snapshot (/snapshots/domain/timestamp/index.html)

Show pages crawled + timestamp

🔁 Re-Archive
Trigger another crawl for a domain

Saves to a new timestamped folder

📦 Metadata Tracking
index.json per domain (stores snapshot metadata)

Timestamp

Page count

Total size





5. User Flows
🔹 Archive Flow
[User enters URL] → [Click “Archive”] → [POST to /api/archive]
→ [Backend crawls & saves content] → [Frontend shows “Success”]


🔹 View Snapshot Flow
[User lands on dashboard] → [GET /api/snapshots]
→ [List of sites + versions] → [Click to view snapshot]
→ [Open static /snapshots/... HTML page]
