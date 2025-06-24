const rewriteAndDownloadAssets = require('./archive/assetHelper');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🧪 Testing asset rewriting...');
  
  const pages = { 
    'https://example.com': `<html>
      <head>
        <link rel="stylesheet" href="/style.css">
        <script src="/script.js"></script>
      </head>
      <body>
        <img src="/image.png">
      </body>
    </html>` 
  };
  
  console.log('📄 Before rewriting:');
  console.log(pages['https://example.com']);
  
  const testDir = path.join(__dirname, 'test-assets');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true });
  }
  fs.mkdirSync(testDir, { recursive: true });
  
  await rewriteAndDownloadAssets(pages, testDir);
  
  console.log('\n📄 After rewriting:');
  console.log(pages['https://example.com']);
  
  // Clean up
  fs.rmSync(testDir, { recursive: true });
})(); 