const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/snapshots', express.static(path.join(__dirname, '..', 'archives')));

// Serve static files from public directory
const publicDir = path.join(__dirname, 'public');
console.log('Serving static files from:', publicDir);
app.use(express.static(publicDir));

// Fallback for / if static file not found
app.get('/', (req, res) => {
  res.status(500).send('<h2>Static index.html not found or not served. Check backend/public/index.html and server config.</h2>');
});

// Simple test endpoint to verify the server is working
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!', 
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

app.post('/api/archive', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  // Simple mock response for now
  res.json({ 
    message: `Archiving ${url} (logic not implemented yet)`,
    url: url,
    status: 'pending'
  });
});

app.get('/api/snapshots', (req, res) => {
  // Return mock data for now
  res.json([
    {
      id: 1,
      url: 'https://example.com',
      timestamp: new Date().toISOString(),
      status: 'completed'
    }
  ]);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
});
