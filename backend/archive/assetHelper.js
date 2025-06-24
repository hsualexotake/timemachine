const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { URL } = require('url');

/**
 * Downloads and rewrites assets in HTML files.
 * @param {Object} pages - Map of URL → HTML string (will be modified in-place)
 * @param {string} baseDir - Directory to save rewritten HTML and assets
 * @param {string} originalUrl - The original URL that was requested to be archived
 */
async function rewriteAndDownloadAssets(pages, baseDir, originalUrl) {
  const assetDir = path.join(baseDir, 'assets');
  fs.mkdirSync(assetDir, { recursive: true });

  const assetMap = new Map(); // Map to avoid duplicate downloads
  
  // Create a mapping from original URLs to local filenames
  const urlToFilename = new Map();
  
  for (const [url] of Object.entries(pages)) {
    const pageParsed = new URL(url);
    let filename;

    // Use the exact same naming logic as in server.js
    if (url === originalUrl || pageParsed.pathname === '/') {
      filename = 'index.html';
    } else {
      const slug = pageParsed.pathname.replace(/^\/|\/$/g, '').replace(/\//g, '_');
      filename = `${slug}.html`;
    }
    
    urlToFilename.set(url, filename);
  }

  for (const [url, html] of Object.entries(pages)) {
    const $ = cheerio.load(html);
    const pageUrl = new URL(url);

    const collectAndRewrite = (selector, attr) => {
      $(selector).each((_, el) => {
        const original = $(el).attr(attr);
        if (!original || original.startsWith('data:')) return;

        try {
          const fullUrl = new URL(original, pageUrl).toString();
          
          // Better asset name generation
          let assetName;
          const urlObj = new URL(fullUrl);
          const pathname = urlObj.pathname;
          const filename = pathname.split('/').pop() || 'asset';
          
          // Handle query parameters - keep them but make them filesystem-safe
          if (urlObj.search) {
            const queryHash = Buffer.from(urlObj.search).toString('base64').substring(0, 8);
            const extension = path.extname(filename) || '';
            const nameWithoutExt = filename.replace(extension, '');
            assetName = `${nameWithoutExt}_${queryHash}${extension}`;
          } else {
            assetName = filename;
          }
          
          // Ensure we have a reasonable filename
          if (!assetName || assetName === '/' || assetName === '') {
            assetName = 'index_' + Math.random().toString(36).substring(7);
          }
          
          // Make filename filesystem-safe
          assetName = assetName.replace(/[^a-zA-Z0-9._-]/g, '_');
          
          const localPath = `assets/${assetName}`;
          assetMap.set(fullUrl, path.join(assetDir, assetName));
          $(el).attr(attr, localPath);
        } catch {
          // skip invalid URLs
        }
      });
    };

    // Rewrite internal page links
    $('a[href]').each((_, el) => {
      const original = $(el).attr('href');
      if (!original || original.startsWith('#') || original.startsWith('mailto:') || original.startsWith('tel:')) {
        return; // Skip anchors, mailto, tel links
      }

      try {
        const fullUrl = new URL(original, pageUrl).toString();
        const originalParsed = new URL(original, pageUrl);
        
        // Check if this is an internal link (same domain)
        if (originalParsed.hostname === pageUrl.hostname) {
          // Check if this URL was crawled (exists in our pages)
          if (urlToFilename.has(fullUrl)) {
            const localFilename = urlToFilename.get(fullUrl);
            $(el).attr('href', localFilename);
            console.log(`🔗 Rewritten link: ${original} → ${localFilename}`);
          } else {
            // Internal link that wasn't crawled - keep original URL but add a class
            $(el).addClass('uncrawled-link');
            $(el).attr('data-original-href', original);
            // Keep the original href so it goes to the live site
            console.log(`⚠️ Uncrawled internal link kept as original: ${original}`);
          }
        }
        // External links are left unchanged
      } catch {
        // skip invalid URLs
      }
    });

    collectAndRewrite('link[href]', 'href');
    collectAndRewrite('script[src]', 'src');
    collectAndRewrite('img[src]', 'src');

    // Update the pages object with rewritten HTML
    pages[url] = $.html();
    console.log(`🔄 Rewritten asset URLs and internal links for: ${url}`);
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
