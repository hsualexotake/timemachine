const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');
const { URL } = require('url');

const crawl = require('./archive/crawler');
const rewriteAndDownloadAssets = require('./archive/assetHelper');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve archived snapshots
app.use('/snapshots', express.static(path.join(__dirname, '..', 'archives')));

// Serve static frontend files if needed
const publicDir = path.join(__dirname, 'public');
console.log('Serving static files from:', publicDir);
app.use(express.static(publicDir));

// Root fallback
app.get('/', (req, res) => {
  res.status(500).send('<h2>Static index.html not found or not served. Check backend/public/index.html and server config.</h2>');
});

// API health check
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

// POST /api/archive → Crawl, Save, Return snapshotPath
app.post('/api/archive', async (req, res) => {
  const { url, depth = 1 } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const pages = await crawl(url, depth);
    const parsed = new URL(url);
    const domain = parsed.hostname;

    // Debug: Log original HTML snippet
    console.log('🔍 Original HTML snippet:', Object.values(pages)[0].substring(0, 200));

    // Convert /newshour/ → ['newshour']
    const subpath = parsed.pathname.replace(/^\/|\/$/g, '');
    const pathSegments = subpath ? subpath.split('/') : [];

    const timestamp = dayjs().format('YYYY-MM-DDTHH-mm-ss');
    const baseDir = path.join(__dirname, '..', 'archives', domain, ...pathSegments, timestamp);
    fs.mkdirSync(baseDir, { recursive: true });

    await rewriteAndDownloadAssets(pages, baseDir);

    // Debug: Log rewritten HTML snippet
    console.log('🔍 Rewritten HTML snippet:', Object.values(pages)[0].substring(0, 200));

    // Save each page
    let entrySnapshot = null;
    for (const [pageUrl, html] of Object.entries(pages)) {
      const pageParsed = new URL(pageUrl);
      let filename;

      if (pageUrl === url || pageParsed.pathname === '/') {
        filename = 'index.html';
      } else {
        const slug = pageParsed.pathname.replace(/^\/|\/$/g, '').replace(/\//g, '_');
        filename = `${slug}.html`;
      }

      const filePath = path.join(baseDir, filename);
      
      // Debug: Log what HTML is being saved
      console.log(`💾 Saving HTML for ${pageUrl} (${html.length} chars): ${html.substring(0, 100)}...`);
      
      fs.writeFileSync(filePath, html);

      if (pageUrl === url) {
        entrySnapshot = filename;
      }
    }

    const snapshotPath = path.join(
      '/snapshots',
      domain,
      ...pathSegments,
      timestamp,
      entrySnapshot || 'index.html'
    ).replace(/\\/g, '/'); // Normalize slashes (for Windows)

    res.status(200).json({
      message: 'Archive complete',
      snapshotPath,
      url,
      timestamp,
      status: 'success',
    });
  } catch (err) {
    console.error('❌ Archiving error:', err.message);
    res.status(500).json({ error: 'Failed to archive site' });
  }
});

// (Optional) GET /api/snapshots stub
app.get('/api/snapshots', (req, res) => {
  res.json([
    {
      id: 1,
      url: 'https://example.com',
      timestamp: new Date().toISOString(),
      status: 'completed'
    }
  ]);
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
