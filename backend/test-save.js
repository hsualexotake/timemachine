const crawl = require('./archive/crawler');
const rewriteAndDownloadAssets = require('./archive/assetHelper');

const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const dayjs = require('dayjs');

(async () => {
  const startUrl = 'https://cnn.com'; // change this to test different sites
  const pages = await crawl(startUrl, 1);

  const domain = new URL(startUrl).hostname;
  const timestamp = dayjs().format('YYYY-MM-DDTHH-mm-ss');
  const baseDir = path.join(__dirname, '..', 'archives', domain, timestamp);

  fs.mkdirSync(baseDir, { recursive: true });

  console.log(`📂 Saving HTML snapshots and rewriting asset links...`);
  await rewriteAndDownloadAssets(pages, baseDir);

  console.log(`✅ All pages and assets saved to: ${baseDir}`);
})();
