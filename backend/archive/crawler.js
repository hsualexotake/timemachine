const axios = require("axios");
const cheerio = require("cheerio");
const { URL } = require("url");

async function crawl(startUrl, maxDepth = 2) {
  const visited = new Set();
  const pages = {};

  const startDomain = new URL(startUrl).hostname;

  async function crawlPage(url, depth) {
    if (depth > maxDepth || visited.has(url)) return;
    visited.add(url);

    try {
      console.log(`[depth ${depth}] Fetching: ${url}`);
      const res = await axios.get(url);
      const html = res.data;
      pages[url] = html;

      const $ = cheerio.load(html);
      const links = $("a");

      for (let i = 0; i < links.length; i++) {
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
          await crawlPage(fullUrl, depth + 1);
        }
      }
    } catch (err) {
      console.warn(`❌ Failed to fetch ${url}: ${err.message}`);
    }
  }

  await crawlPage(startUrl, 0);
  return pages;
}

module.exports = crawl;
