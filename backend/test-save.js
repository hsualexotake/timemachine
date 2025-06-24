const crawl = require('./archive/crawler');
const rewriteAndDownloadAssets = require('./archive/assetHelper');

const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const dayjs = require('dayjs');

(async () => {
  const startUrl = 'https://www.pbs.org/newshour/'; // Change this to test other URLs
  const pages = await crawl(startUrl, 0);

  const parsed = new URL(startUrl);
  const domain = parsed.hostname;

  // Extract subpath and break into folder segments
  const subpath = parsed.pathname.replace(/^\/|\/$/g, ''); // remove leading/trailing slashes
  const pathSegments = subpath ? subpath.split('/') : [];

  const timestamp = dayjs().format('YYYY-MM-DDTHH-mm-ss');
  const archiveDir = path.join(__dirname, '..', 'archives', domain, ...pathSegments, timestamp);
  fs.mkdirSync(archiveDir, { recursive: true });

  console.log(`📂 Saving HTML snapshots and rewriting asset links...`);
  await rewriteAndDownloadAssets(pages, archiveDir);

  let entrySnapshot = null;

  for (const [url, html] of Object.entries(pages)) {
    const pageUrl = new URL(url);
    let filename;

    // Save start URL as index.html
    if (url === startUrl || pageUrl.pathname === '/') {
      filename = 'index.html';
    } else {
      const slug = pageUrl.pathname.replace(/^\/|\/$/g, '').replace(/\//g, '_');
      filename = `${slug}.html`;
    }

    const filePath = path.join(archiveDir, filename);
    fs.writeFileSync(filePath, html);
    console.log(`✅ Saved ${url} → ${filePath}`);

    if (url === startUrl) {
      entrySnapshot = filename;
    }
  }

  const relativeSnapshotPath = path.join(
    '/snapshots',
    domain,
    ...pathSegments,
    timestamp,
    entrySnapshot || 'index.html'
  );

  console.log(`🌐 View snapshot at: http://localhost:3000${relativeSnapshotPath}`);
})();
