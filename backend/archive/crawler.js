const axios = require("axios");
const cheerio = require("cheerio");
const { URL } = require("url");

async function crawl(startUrl, maxDepth = 2, maxPages = 50) {
  const visited = new Set();
  const pages = {};
  let pageCount = 0;

  const startDomain = new URL(startUrl).hostname;

  async function crawlPage(url, depth) {
    if (depth > maxDepth || visited.has(url) || pageCount >= maxPages) return;
    visited.add(url);
    pageCount++;

    try {
      console.log(`[depth ${depth}] [${pageCount}/${maxPages}] Fetching: ${url}`);
      
      // Add timeout and size limit
      const res = await axios.get(url, {
        timeout: 10000, // 10 second timeout
        maxContentLength: 10 * 1024 * 1024, // 10MB limit per page
        maxBodyLength: 10 * 1024 * 1024
      });
      
      const html = res.data;
      pages[url] = html;

      // Memory check - if we're getting too big, stop crawling
      const totalSize = Object.values(pages).reduce((sum, page) => sum + page.length, 0);
      if (totalSize > 50 * 1024 * 1024) { // 50MB total limit
        console.warn(`⚠️ Memory limit reached (${Math.round(totalSize / 1024 / 1024)}MB), stopping crawl`);
        return;
      }

      const $ = cheerio.load(html);
      const links = $("a");

      for (let i = 0; i < links.length && pageCount < maxPages; i++) {
        const href = $(links[i]).attr("href");
        if (!href) continue;

        let fullUrl;
        try {
          fullUrl = new URL(href, url).toString();
        } catch {
          continue; // skip invalid URLs
        }

        // Only crawl same-domain links
        if (new URL(fullUrl).hostname === startDomain) {
          // Skip certain types of URLs that are better left as external links
          const urlPath = new URL(fullUrl).pathname + new URL(fullUrl).search;
          const shouldSkip = (
            urlPath.includes('/user?') ||           // User profiles
            urlPath.includes('vote?') ||            // Voting links
            urlPath.includes('reply?') ||           // Reply forms
            urlPath.includes('login?') ||           // Login pages
            urlPath.includes('hide?') ||            // Hide links
            urlPath.match(/\/item\?id=\d+$/) ||     // Individual items (keep some, skip most)
            urlPath.includes('submit') ||           // Submit pages
            urlPath.includes('logout')              // Logout links
          );
          
          if (!shouldSkip) {
            await crawlPage(fullUrl, depth + 1);
          } else {
            console.log(`⏭️ Skipping URL (not suitable for crawling): ${fullUrl}`);
          }
        }
      }
    } catch (err) {
      console.warn(`❌ Failed to fetch ${url}: ${err.message}`);
    }
  }

  await crawlPage(startUrl, 0);
  console.log(`✅ Crawl complete: ${Object.keys(pages).length} pages collected`);
  return pages;
}

module.exports = crawl;
