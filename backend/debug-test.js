const rewriteAndDownloadAssets = require('./archive/assetHelper');
const path = require('path');

async function testAssetRewriting() {
  console.log('🧪 Testing asset rewriting...');
  
  // Create a test pages object similar to what the crawler produces
  const pages = {
    'https://www.hsualexotake.com': `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/_next/static/css/7db2fe9dbac1cb42.css">
  <script src="/_next/static/chunks/webpack-8b985ceca1aa199f.js"></script>
</head>
<body>
  <img src="/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fpersonalportfoliopic.540bb5c6.png&w=3840&q=95">
</body>
</html>`
  };

  console.log('📋 Original HTML:');
  console.log(pages['https://www.hsualexotake.com']);
  console.log('\n');

  const baseDir = path.join(__dirname, '..', 'test-output');
  
  try {
    await rewriteAndDownloadAssets(pages, baseDir);
    
    console.log('✅ Asset rewriting completed');
    console.log('📋 Modified HTML:');
    console.log(pages['https://www.hsualexotake.com']);
    
  } catch (error) {
    console.error('❌ Error during asset rewriting:', error);
  }
}

testAssetRewriting(); 