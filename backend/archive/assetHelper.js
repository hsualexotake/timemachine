const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { URL } = require('url');

/**
 * Downloads and rewrites assets in HTML files.
 * @param {Object} pages - Map of URL → HTML string (will be modified in-place)
 * @param {string} baseDir - Directory to save rewritten HTML and assets
 */
async function rewriteAndDownloadAssets(pages, baseDir) {
  const assetDir = path.join(baseDir, 'assets');
  fs.mkdirSync(assetDir, { recursive: true });

  const assetMap = new Map(); // Map to avoid duplicate downloads

  for (const [url, html] of Object.entries(pages)) {
    const $ = cheerio.load(html);
    const pageUrl = new URL(url);

    const collectAndRewrite = (selector, attr) => {
      $(selector).each((_, el) => {
        const original = $(el).attr(attr);
        if (!original || original.startsWith('data:')) return;

        try {
          const fullUrl = new URL(original, pageUrl).toString();
          const assetName = encodeURIComponent(fullUrl.split('/').pop() || 'asset');
          const localPath = `assets/${assetName}`;
          assetMap.set(fullUrl, path.join(assetDir, assetName));
          $(el).attr(attr, localPath);
        } catch {
          // skip invalid URLs
        }
      });
    };

    collectAndRewrite('link[href]', 'href');
    collectAndRewrite('script[src]', 'src');
    collectAndRewrite('img[src]', 'src');

    // Update the pages object with rewritten HTML
    pages[url] = $.html();
    console.log(`🔄 Rewritten asset URLs for: ${url}`);
  }

  // Download all unique assets
  for (const [remoteUrl, localPath] of assetMap.entries()) {
    try {
      const response = await axios.get(remoteUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(localPath, response.data);
      console.log(`📦 Downloaded asset: ${remoteUrl}`);
    } catch (err) {
      console.warn(`⚠️ Failed to download asset: ${remoteUrl} (${err.message})`);
    }
  }
}

module.exports = rewriteAndDownloadAssets;
