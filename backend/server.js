const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');
const { URL } = require('url');

const crawl = require('./archive/crawler');
const rewriteAndDownloadAssets = require('./archive/assetHelper');
const { generateDiff } = require('./archive/diffEngine');

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
    console.log(`🚀 Starting archive for: ${url} (depth: ${depth})`);
    
    // Add memory monitoring
    const startMemory = process.memoryUsage();
    console.log(`📊 Initial memory usage: ${Math.round(startMemory.heapUsed / 1024 / 1024)}MB`);
    
    const pages = await crawl(url, depth, 100); // Increased from 25 to 100 pages
    
    const memoryAfterCrawl = process.memoryUsage();
    console.log(`📊 Memory after crawl: ${Math.round(memoryAfterCrawl.heapUsed / 1024 / 1024)}MB`);
    
    if (Object.keys(pages).length === 0) {
      return res.status(500).json({ error: 'No pages could be crawled from the provided URL' });
    }
    
    const parsed = new URL(url);
    const domain = parsed.hostname;

    // Debug: Log original HTML snippet
    const firstPageHtml = Object.values(pages)[0];
    console.log('🔍 Original HTML snippet:', firstPageHtml.substring(0, 200));

    // Convert /newshour/ → ['newshour']
    const subpath = parsed.pathname.replace(/^\/|\/$/g, '');
    const pathSegments = subpath ? subpath.split('/') : [];

    const timestamp = dayjs().format('YYYY-MM-DDTHH-mm-ss');
    const baseDir = path.join(__dirname, '..', 'archives', domain, ...pathSegments, timestamp);
    fs.mkdirSync(baseDir, { recursive: true });

    console.log('🔄 Starting asset rewriting...');
    await rewriteAndDownloadAssets(pages, baseDir, url);

    const memoryAfterAssets = process.memoryUsage();
    console.log(`📊 Memory after asset processing: ${Math.round(memoryAfterAssets.heapUsed / 1024 / 1024)}MB`);

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
      console.log(`�� Saving HTML for ${pageUrl} (${html.length} chars): ${html.substring(0, 100)}...`);
      
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

    const finalMemory = process.memoryUsage();
    console.log(`📊 Final memory usage: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`);
    console.log(`✅ Archive complete: ${Object.keys(pages).length} pages saved`);

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('🗑️ Garbage collection triggered');
    }

    res.status(200).json({
      message: 'Archive complete',
      snapshotPath,
      url,
      timestamp,
      status: 'success',
      pagesArchived: Object.keys(pages).length
    });
  } catch (err) {
    console.error('❌ Archiving error:', err.message);
    console.error('❌ Stack trace:', err.stack);
    
    // Check if it's a memory error
    if (err.message.includes('heap') || err.message.includes('memory')) {
      res.status(500).json({ 
        error: 'The website is too large to archive. Try a smaller site or increase server memory.' 
      });
    } else {
      res.status(500).json({ error: 'Failed to archive site: ' + err.message });
    }
  }
});

// (Optional) GET /api/snapshots stub
app.get('/api/snapshots', (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    const parsed = new URL(url);
    const domain = parsed.hostname;
    
    // Handle pathname more carefully - if it's just "/" or empty, don't add path segments
    let pathSegments = [];
    if (parsed.pathname && parsed.pathname !== '/') {
      const subpath = parsed.pathname.replace(/^\/|\/$/g, '');
      pathSegments = subpath ? subpath.split('/') : [];
    }
    
    const domainDir = path.join(__dirname, '..', 'archives', domain, ...pathSegments);
    
    if (!fs.existsSync(domainDir)) {
      return res.json([]);
    }

    const snapshots = [];
    const dirContents = fs.readdirSync(domainDir, { withFileTypes: true });
    
    const timestampDirs = dirContents
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .sort((a, b) => b.localeCompare(a)); // Sort newest first

    for (const timestamp of timestampDirs) {
      try {
        const snapshotDir = path.join(domainDir, timestamp);
        const files = fs.readdirSync(snapshotDir);
        const entryFile = files.includes('index.html') ? 'index.html' : files.find(f => f.endsWith('.html'));
        
        if (entryFile) {
          const snapshotPath = path.join('/snapshots', domain, ...pathSegments, timestamp, entryFile).replace(/\\/g, '/');
          
          // Parse timestamp more carefully
          let parsedDate;
          let displayDate;
          try {
            // The format is YYYY-MM-DDTHH-mm-ss, so we need to use the correct dayjs format
            // Convert the timestamp to a format dayjs can understand
            const isoString = timestamp.replace(/T/, 'T').replace(/-/g, ':', 3);
            // This converts "2025-06-24T11-34-37" to "2025-06-24T11:34:37"
            const properFormat = timestamp.replace(/T(\d{2})-(\d{2})-(\d{2})$/, 'T$1:$2:$3');
            
            parsedDate = dayjs(properFormat);
            
            if (parsedDate.isValid()) {
              displayDate = parsedDate.format('MMM D, YYYY h:mm A');
            } else {
              // Fallback to showing the raw timestamp in a readable format
              displayDate = timestamp.replace('T', ' at ').replace(/-/g, ':', 3);
            }
          } catch (dateErr) {
            console.error(`❌ Date parsing error for ${timestamp}:`, dateErr.message);
            displayDate = timestamp.replace('T', ' at ').replace(/-/g, ':', 3);
          }
          
          snapshots.push({
            id: timestamp,
            url,
            timestamp: parsedDate && parsedDate.isValid() ? parsedDate.toISOString() : new Date().toISOString(),
            snapshotPath,
            displayDate
          });
        }
      } catch (snapshotErr) {
        console.error(`❌ Error processing snapshot ${timestamp}:`, snapshotErr.message);
        // Continue with other snapshots
      }
    }

    res.json(snapshots);
  } catch (err) {
    console.error('❌ Error fetching snapshots:', err.message);
    res.status(500).json({ error: 'Failed to fetch snapshots' });
  }
});

// POST /api/compare → Compare two snapshots
app.post('/api/compare', async (req, res) => {
  const { url, snapshot1Id, snapshot2Id } = req.body;

  if (!url || !snapshot1Id || !snapshot2Id) {
    return res.status(400).json({ 
      error: 'URL, snapshot1Id, and snapshot2Id are required' 
    });
  }

  try {
    console.log(`🔍 Comparing snapshots: ${snapshot1Id} vs ${snapshot2Id} for ${url}`);
    
    const parsed = new URL(url);
    const domain = parsed.hostname;
    
    // Handle pathname more carefully
    let pathSegments = [];
    if (parsed.pathname && parsed.pathname !== '/') {
      const subpath = parsed.pathname.replace(/^\/|\/$/g, '');
      pathSegments = subpath ? subpath.split('/') : [];
    }
    
    const domainDir = path.join(__dirname, '..', 'archives', domain, ...pathSegments);
    
    // Build paths to the snapshot files
    const snapshot1Dir = path.join(domainDir, snapshot1Id);
    const snapshot2Dir = path.join(domainDir, snapshot2Id);
    
    // Find the main HTML files for each snapshot
    const findMainHtml = (snapshotDir) => {
      if (!fs.existsSync(snapshotDir)) {
        throw new Error(`Snapshot directory not found: ${snapshotDir}`);
      }
      
      const files = fs.readdirSync(snapshotDir);
      const htmlFile = files.includes('index.html') ? 'index.html' : files.find(f => f.endsWith('.html'));
      
      if (!htmlFile) {
        throw new Error(`No HTML file found in snapshot: ${snapshotDir}`);
      }
      
      return path.join(snapshotDir, htmlFile);
    };
    
    const snapshot1Path = findMainHtml(snapshot1Dir);
    const snapshot2Path = findMainHtml(snapshot2Dir);
    
    // Generate the diff
    const diffResult = await generateDiff(snapshot1Path, snapshot2Path);
    
    if (!diffResult.success) {
      return res.status(500).json({ 
        error: 'Failed to generate diff: ' + diffResult.error 
      });
    }
    
    // Add snapshot metadata
    const response = {
      ...diffResult,
      snapshots: {
        snapshot1: {
          id: snapshot1Id,
          displayDate: formatSnapshotDate(snapshot1Id)
        },
        snapshot2: {
          id: snapshot2Id,
          displayDate: formatSnapshotDate(snapshot2Id)
        }
      },
      url,
      comparisonTimestamp: new Date().toISOString()
    };
    
    console.log(`✅ Comparison complete: ${diffResult.changes.summary.totalChanges} changes found`);
    
    res.json(response);
  } catch (err) {
    console.error('❌ Comparison error:', err.message);
    res.status(500).json({ error: 'Failed to compare snapshots: ' + err.message });
  }
});

// Helper function to format snapshot date (reused from existing code)
function formatSnapshotDate(timestamp) {
  try {
    const properFormat = timestamp.replace(/T(\d{2})-(\d{2})-(\d{2})$/, 'T$1:$2:$3');
    const parsedDate = dayjs(properFormat);
    
    if (parsedDate.isValid()) {
      return parsedDate.format('MMM D, YYYY h:mm A');
    } else {
      return timestamp.replace('T', ' at ').replace(/-/g, ':', 3);
    }
  } catch (dateErr) {
    return timestamp.replace('T', ' at ').replace(/-/g, ':', 3);
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
