const crawl = require('./archive/crawler');

(async () => {
    const url = 'https://en.wikipedia.org/wiki/Main_Page';
    
    // or any small site
  const result = await crawl(url, 2);

  console.log("Crawled pages:");
  for (const [url, html] of Object.entries(result)) {
    console.log(`- ${url} (${html.length} chars)`);
  }
})();
