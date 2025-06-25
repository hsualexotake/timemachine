# 📊 Snapshot Comparison Feature

## Overview

The Website Archiver now includes a powerful snapshot comparison feature that allows you to compare two archived versions of the same website and see exactly what changed between them.

## ✨ Features

### Content-Focused Comparison
- **Meaningful Changes Only**: Focuses on user-visible content rather than raw HTML differences
- **Structured Analysis**: Extracts and compares specific content types (headings, paragraphs, links, images, etc.)
- **Smart Categorization**: Organizes changes into Added, Removed, and Modified categories

### Visual Diff Interface
- **Color-Coded Changes**: Green for additions, red for removals, yellow for modifications
- **Detailed Breakdown**: Shows exactly what content changed in each section
- **Summary Statistics**: Quick overview of total changes and their types

### Content Types Tracked
- **Page Title**: Track title changes between versions
- **Headings** (H1-H6): Monitor heading text and structure changes
- **Paragraphs**: Detect text content modifications
- **Links**: Track new, removed, or modified links
- **Images**: Monitor image source and alt text changes
- **Lists**: Detect changes in list items and structure
- **Tables**: Track table structure and content changes
- **Forms**: Monitor form field changes
- **Meta Tags**: Track metadata modifications

## 🚀 How to Use

### 1. Archive Multiple Snapshots
First, create multiple snapshots of the same website over time:
1. Enter a URL in the main interface
2. Click "Capture Snapshot" to create your first archive
3. Wait some time (hours, days, etc.) for the website to change
4. Capture another snapshot of the same URL

### 2. Access Comparison
1. Enter the URL you want to compare
2. Click "View Existing" to see available snapshots
3. If you have 2+ snapshots, you'll see a "Compare" button
4. Click the "Compare" button to open the comparison modal

### 3. Select Snapshots to Compare
1. Choose the **First Snapshot** (typically the older one)
2. Choose the **Second Snapshot** (typically the newer one)
3. Click "Compare Snapshots" to generate the diff

### 4. Review Changes
The comparison results show:
- **Summary**: Total changes and breakdown by type
- **Title Changes**: Old vs new page titles
- **Content Changes**: Detailed breakdown by content type
- **Visual Indicators**: Color-coded additions, removals, and modifications

## 🔧 Technical Implementation

### Backend Components

#### Diff Engine (`backend/archive/diffEngine.js`)
- **Content Extraction**: Parses HTML and extracts meaningful content
- **Comparison Logic**: Compares content structures and identifies changes
- **Change Categorization**: Organizes differences into actionable categories

#### API Endpoint (`POST /api/compare`)
- **Input**: URL and two snapshot IDs to compare
- **Processing**: Locates snapshot files and generates comparison
- **Output**: Structured diff results with metadata

### Frontend Components

#### Comparison Modal (`frontend/src/components/ComparisonModal.jsx`)
- **Snapshot Selection**: Interface for choosing which snapshots to compare
- **Results Display**: Visual representation of changes with color coding
- **Navigation**: Easy switching between selection and results views

#### Integration (`frontend/src/App.jsx`)
- **Compare Button**: Appears when 2+ snapshots exist
- **Modal Management**: Handles opening/closing comparison interface

## 📝 Example Use Cases

### Website Monitoring
- Track changes to important pages over time
- Monitor competitor website updates
- Detect content modifications for compliance

### Content Management
- Review changes before publishing
- Track editorial modifications
- Monitor automated content updates

### SEO Analysis
- Track meta tag changes
- Monitor heading structure modifications
- Detect link profile changes

## 🎯 Change Detection Examples

### Title Changes
```
Old: "My Company - Home Page"
New: "My Company - Welcome to Our New Site"
```

### Content Additions
```
Added Paragraph: "We're excited to announce our new product line!"
Added Link: "View Products" → /products
```

### Content Modifications
```
Modified Heading: "About Us" → "About Our Company"
Modified Image: logo.png → new-logo.png
```

### Structural Changes
```
Modified List: 3 items → 5 items
Added Table: New pricing table with 4 columns
```

## 🔍 Technical Details

### Content Extraction Process
1. **Parse HTML**: Load HTML content using Cheerio
2. **Clean Content**: Remove scripts, styles, and non-visible elements
3. **Extract Elements**: Identify and extract specific content types
4. **Structure Data**: Organize content into comparable objects

### Comparison Algorithm
1. **Map Content**: Create maps of content items for efficient comparison
2. **Identify Changes**: Compare old vs new content maps
3. **Categorize Differences**: Sort changes into added, removed, modified
4. **Generate Summary**: Calculate statistics and create overview

### Performance Considerations
- **Memory Efficient**: Processes content in chunks to handle large pages
- **Fast Comparison**: Uses optimized algorithms for quick diff generation
- **Scalable**: Can handle multiple snapshots and large content volumes

## 🛠️ API Reference

### Compare Snapshots
```http
POST /api/compare
Content-Type: application/json

{
  "url": "https://example.com",
  "snapshot1Id": "2025-01-15T10-30-00",
  "snapshot2Id": "2025-01-16T14-45-00"
}
```

### Response Format
```json
{
  "success": true,
  "changes": {
    "title": { "old": "...", "new": "..." },
    "headings": { "added": [...], "removed": [...], "modified": [...] },
    "paragraphs": { "added": [...], "removed": [...], "modified": [...] },
    "summary": {
      "totalChanges": 15,
      "addedElements": 8,
      "removedElements": 3,
      "modifiedElements": 4
    }
  },
  "snapshots": {
    "snapshot1": { "id": "...", "displayDate": "..." },
    "snapshot2": { "id": "...", "displayDate": "..." }
  }
}
```

## 🚀 Future Enhancements

### Planned Features
- **Side-by-Side View**: Visual comparison with both versions displayed
- **Export Reports**: Generate PDF or HTML reports of changes
- **Change Filtering**: Filter by change type or content category
- **Scheduled Comparisons**: Automatic comparison of new snapshots
- **Change Notifications**: Email alerts when significant changes detected

### Potential Improvements
- **Visual Diff**: Highlight changes directly in the rendered page
- **Semantic Analysis**: Detect meaning changes beyond text differences
- **Performance Optimization**: Faster processing for very large pages
- **Custom Rules**: User-defined comparison criteria

## 📋 Dependencies

### Backend
- `fast-diff`: Efficient text diffing algorithm
- `cheerio`: HTML parsing and manipulation
- `fs`: File system operations for reading snapshots

### Frontend
- `react`: Component framework
- `tailwindcss`: Styling and visual design

## 🐛 Troubleshooting

### Common Issues

#### "No HTML file found in snapshot"
- **Cause**: Snapshot directory is corrupted or incomplete
- **Solution**: Re-archive the URL to create a new snapshot

#### "Failed to generate diff"
- **Cause**: One or both snapshot files are corrupted
- **Solution**: Check file permissions and re-archive if necessary

#### "Comparison taking too long"
- **Cause**: Very large HTML files or complex content
- **Solution**: The system will handle it, but may take a few seconds

### Performance Tips
- **Archive Regularly**: Create snapshots at regular intervals for better comparison
- **Clean URLs**: Use consistent URLs for better snapshot organization
- **Monitor Size**: Very large pages may take longer to compare

---

*This comparison feature transforms your website archiver from a simple backup tool into a powerful change tracking system. Monitor your websites like never before!* 