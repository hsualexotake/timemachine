const cheerio = require('cheerio');
const fastDiff = require('fast-diff');
const fs = require('fs');
const path = require('path');

/**
 * Extracts meaningful content from HTML for comparison
 * @param {string} html - HTML content to parse
 * @returns {Object} Structured content for comparison
 */
function extractContent(html) {
  const $ = cheerio.load(html);
  
  // Remove script and style tags as they're not user-visible content
  $('script, style, noscript').remove();
  
  const content = {
    title: $('title').text().trim(),
    headings: [],
    paragraphs: [],
    links: [],
    images: [],
    lists: [],
    tables: [],
    forms: [],
    meta: {}
  };
  
  // Extract headings (h1-h6)
  $('h1, h2, h3, h4, h5, h6').each((i, el) => {
    const $el = $(el);
    content.headings.push({
      level: el.tagName.toLowerCase(),
      text: $el.text().trim(),
      id: $el.attr('id') || null,
      classes: $el.attr('class') || null
    });
  });
  
  // Extract paragraphs
  $('p').each((i, el) => {
    const text = $(el).text().trim();
    if (text) {
      content.paragraphs.push({
        text,
        classes: $(el).attr('class') || null
      });
    }
  });
  
  // Extract links
  $('a[href]').each((i, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const text = $el.text().trim();
    if (text && href) {
      content.links.push({
        href,
        text,
        title: $el.attr('title') || null
      });
    }
  });
  
  // Extract images
  $('img[src]').each((i, el) => {
    const $el = $(el);
    content.images.push({
      src: $el.attr('src'),
      alt: $el.attr('alt') || '',
      title: $el.attr('title') || null
    });
  });
  
  // Extract lists
  $('ul, ol').each((i, el) => {
    const $el = $(el);
    const items = [];
    $el.find('li').each((j, li) => {
      const text = $(li).text().trim();
      if (text) items.push(text);
    });
    if (items.length > 0) {
      content.lists.push({
        type: el.tagName.toLowerCase(),
        items,
        classes: $el.attr('class') || null
      });
    }
  });
  
  // Extract tables
  $('table').each((i, el) => {
    const $table = $(el);
    const headers = [];
    const rows = [];
    
    $table.find('th').each((j, th) => {
      headers.push($(th).text().trim());
    });
    
    $table.find('tr').each((j, tr) => {
      const cells = [];
      $(tr).find('td').each((k, td) => {
        cells.push($(td).text().trim());
      });
      if (cells.length > 0) rows.push(cells);
    });
    
    if (headers.length > 0 || rows.length > 0) {
      content.tables.push({ headers, rows });
    }
  });
  
  // Extract forms
  $('form').each((i, el) => {
    const $form = $(el);
    const inputs = [];
    
    $form.find('input, textarea, select').each((j, input) => {
      const $input = $(input);
      inputs.push({
        type: $input.attr('type') || input.tagName.toLowerCase(),
        name: $input.attr('name') || null,
        placeholder: $input.attr('placeholder') || null,
        value: $input.val() || null
      });
    });
    
    if (inputs.length > 0) {
      content.forms.push({
        action: $form.attr('action') || null,
        method: $form.attr('method') || 'get',
        inputs
      });
    }
  });
  
  // Extract meta information
  $('meta').each((i, el) => {
    const $meta = $(el);
    const name = $meta.attr('name') || $meta.attr('property');
    const content_attr = $meta.attr('content');
    if (name && content_attr) {
      content.meta[name] = content_attr;
    }
  });
  
  return content;
}

/**
 * Compares two content objects and returns differences
 * @param {Object} oldContent - Content from older snapshot
 * @param {Object} newContent - Content from newer snapshot
 * @returns {Object} Diff results with changes categorized
 */
function compareContent(oldContent, newContent) {
  const changes = {
    title: null,
    headings: { added: [], removed: [], modified: [] },
    paragraphs: { added: [], removed: [], modified: [] },
    links: { added: [], removed: [], modified: [] },
    images: { added: [], removed: [], modified: [] },
    lists: { added: [], removed: [], modified: [] },
    tables: { added: [], removed: [], modified: [] },
    forms: { added: [], removed: [], modified: [] },
    meta: { added: [], removed: [], modified: [] },
    summary: {
      totalChanges: 0,
      addedElements: 0,
      removedElements: 0,
      modifiedElements: 0
    }
  };
  
  // Compare title
  if (oldContent.title !== newContent.title) {
    changes.title = {
      old: oldContent.title,
      new: newContent.title,
      diff: fastDiff(oldContent.title, newContent.title)
    };
    changes.summary.modifiedElements++;
  }
  
  // Helper function to compare arrays of objects
  function compareArrays(oldArray, newArray, keyField = 'text') {
    const oldMap = new Map();
    const newMap = new Map();
    
    // Create better unique keys based on content type
    const createKey = (item, keyField) => {
      if (typeof item === 'string') return item;
      
      // For different content types, create more comprehensive keys
      if (keyField === 'text' && item.text) {
        return item.text.trim();
      } else if (keyField === 'href' && item.href && item.text) {
        return `${item.href}|${item.text.trim()}`;
      } else if (keyField === 'src' && item.src) {
        // For images, normalize the URL to ignore superficial differences
        let normalizedSrc = item.src;
        
        try {
          // Decode URL encoding
          normalizedSrc = decodeURIComponent(normalizedSrc);
          
          // Extract the core image path, ignoring query parameters that don't affect content
          const url = new URL(normalizedSrc, 'http://example.com'); // Base URL for relative paths
          let pathname = url.pathname;
          
          // If it's a Next.js image optimization URL, extract the actual image path
          if (pathname.includes('/_next/image') && url.searchParams.has('url')) {
            pathname = decodeURIComponent(url.searchParams.get('url'));
          }
          
          // Remove common query parameters that don't affect the actual image
          const relevantParams = new URLSearchParams();
          for (const [key, value] of url.searchParams) {
            // Keep parameters that might affect the actual image content
            if (!['w', 'width', 'h', 'height', 'q', 'quality', 'f', 'format'].includes(key.toLowerCase())) {
              relevantParams.set(key, value);
            }
          }
          
          // Create normalized URL
          const paramsString = relevantParams.toString();
          normalizedSrc = pathname + (paramsString ? '?' + paramsString : '');
          
        } catch (e) {
          // If URL parsing fails, just clean up basic encoding
          normalizedSrc = normalizedSrc.replace(/%2F/g, '/').replace(/%3F/g, '?').replace(/%26/g, '&');
        }
        
        // Use normalized source + alt text as key
        return `${normalizedSrc}|${item.alt || ''}`;
      } else if (keyField === 'items' && Array.isArray(item.items)) {
        // For lists, create a key based on type and first few items
        const itemsKey = item.items.slice(0, 5).join('|');
        return `${item.type || 'list'}:${itemsKey}`;
      } else if (keyField === 'headers' && Array.isArray(item.headers)) {
        // For tables, use headers as key
        return item.headers.join('|');
      } else if (keyField === 'action' && item.action) {
        // For forms, use action and input count
        return `${item.action}:${item.inputs?.length || 0}`;
      } else if (Array.isArray(item) && item.length >= 2) {
        // For meta tags (array format)
        return `${item[0]}:${item[1]}`;
      }
      
      // Fallback to the specified field or stringify
      return item[keyField] || JSON.stringify(item);
    };
    
    // Don't add index to the items when storing them
    oldArray.forEach((item, index) => {
      const key = createKey(item, keyField);
      oldMap.set(key, item); // Store original item without index
    });
    
    newArray.forEach((item, index) => {
      const key = createKey(item, keyField);
      newMap.set(key, item); // Store original item without index
    });
    
    const result = { added: [], removed: [], modified: [] };
    
    // Find removed items
    for (const [key, item] of oldMap) {
      if (!newMap.has(key)) {
        result.removed.push(item);
        changes.summary.removedElements++;
      }
    }
    
    // Find added and modified items
    for (const [key, item] of newMap) {
      if (!oldMap.has(key)) {
        result.added.push(item);
        changes.summary.addedElements++;
      } else {
        const oldItem = oldMap.get(key);
        // Create clean copies for comparison (without any added properties)
        const cleanOldItem = typeof oldItem === 'string' ? oldItem : { ...oldItem };
        const cleanNewItem = typeof item === 'string' ? item : { ...item };
        
        // Check if item was actually modified (comparing content, not position)
        if (JSON.stringify(cleanOldItem) !== JSON.stringify(cleanNewItem)) {
          result.modified.push({
            old: cleanOldItem,
            new: cleanNewItem,
            key
          });
          changes.summary.modifiedElements++;
        }
      }
    }
    
    return result;
  }
  
  // Compare different content types
  changes.headings = compareArrays(oldContent.headings, newContent.headings, 'text');
  changes.paragraphs = compareArrays(oldContent.paragraphs, newContent.paragraphs, 'text');
  changes.links = compareArrays(oldContent.links, newContent.links, 'href');
  changes.images = compareArrays(oldContent.images, newContent.images, 'src');
  changes.lists = compareArrays(oldContent.lists, newContent.lists, 'items');
  changes.tables = compareArrays(oldContent.tables, newContent.tables, 'headers');
  changes.forms = compareArrays(oldContent.forms, newContent.forms, 'action');
  
  // Compare meta tags
  const oldMeta = Object.entries(oldContent.meta);
  const newMeta = Object.entries(newContent.meta);
  changes.meta = compareArrays(oldMeta, newMeta, '0');
  
  // Calculate total changes
  changes.summary.totalChanges = 
    changes.summary.addedElements + 
    changes.summary.removedElements + 
    changes.summary.modifiedElements +
    (changes.title ? 1 : 0);
  
  return changes;
}

/**
 * Generates HTML diff between two snapshots
 * @param {string} snapshot1Path - Path to first snapshot HTML file
 * @param {string} snapshot2Path - Path to second snapshot HTML file
 * @returns {Object} Comparison results
 */
async function generateDiff(snapshot1Path, snapshot2Path) {
  try {
    // Read both HTML files
    const html1 = fs.readFileSync(snapshot1Path, 'utf8');
    const html2 = fs.readFileSync(snapshot2Path, 'utf8');
    
    // Extract content from both snapshots
    const content1 = extractContent(html1);
    const content2 = extractContent(html2);
    
    // Compare the content
    const changes = compareContent(content1, content2);
    
    return {
      success: true,
      changes,
      metadata: {
        snapshot1: {
          path: snapshot1Path,
          size: html1.length,
          contentSummary: {
            headings: content1.headings.length,
            paragraphs: content1.paragraphs.length,
            links: content1.links.length,
            images: content1.images.length
          }
        },
        snapshot2: {
          path: snapshot2Path,
          size: html2.length,
          contentSummary: {
            headings: content2.headings.length,
            paragraphs: content2.paragraphs.length,
            links: content2.links.length,
            images: content2.images.length
          }
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  extractContent,
  compareContent,
  generateDiff
}; 