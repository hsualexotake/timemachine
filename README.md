# Alex's Time Machine

A lightweight website archiver that captures and preserves websites with snapshot comparison capabilities. Similar to the Wayback Machine, but runs locally.

##  Features

### Website Archiving
- **Complete Snapshots**: Archives HTML, CSS, JavaScript, images, and other assets
- **Recursive Crawling**: Automatically discovers and archives internal links
- **Timestamp Organization**: Organizes snapshots by domain and timestamp

### View Snapshots
- **View**: Input a URL and view existing snapshots of a website
- **Compare**: Compare any two snapshots with color-coded changes. Tracks meaningful changes (headings, paragraphs, links, images, lists, etc.)
- **Detailed Breakdown**: Shows exactly what was added, removed, or modified


## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd timemachine
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

#### Start the Backend Server
```bash
cd backend
node --max-old-space-size=4096 server.js
```
The backend will be available at `http://localhost:3000`

#### Start the Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will be available at `http://localhost:5173`

## 📖 Usage Guide

### Creating Your First Archive

1. **Open the application** in your browser (`http://localhost:5173`)
2. **Enter a URL** in the input field (e.g., `https://example.com`)
3. **Click "Capture Snapshot"** to archive the website
4. **Wait for completion** - you'll see a success message with a link to view the archived snapshot

### Viewing Existing Snapshots

1. **Enter the same URL** you previously archived
2. **Click "View Existing"** to see all available snapshots
3. **Click on any snapshot** to view the archived version

### Comparing Snapshots

1. **Ensure you have 2+ snapshots** of the same URL
2. **Click "View Existing"** and then **"Compare"**
3. **Select two snapshots** to compare (typically older vs newer)
4. **Click "Compare Snapshots"** to see the differences

## Project Structure

```
timemachine/
├── backend/                 # Node.js backend server
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   └── archive/            # Archive processing modules
│       ├── crawler.js      # Website crawling logic
│       ├── assetHelper.js  # Asset downloading and rewriting
│       └── diffEngine.js   # Snapshot comparison engine
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── App.jsx         # Main application component
│   │   └── components/
│   │       └── ComparisonModal.jsx  # Snapshot comparison interface
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite configuration
└── archives/               # Stored website snapshots (auto-created)
```

## API Endpoints

### Backend API (`http://localhost:3000`)

- **GET `/api/test`** - Health check
- **POST `/api/archive`** - Archive a website
  ```json
  {
    "url": "https://example.com",
    "depth": 1
  }
  ```
- **GET `/api/snapshots?url=<url>`** - Get snapshots for a URL
- **POST `/api/compare`** - Compare two snapshots
  ```json
  {
    "url": "https://example.com",
    "snapshot1Id": "2025-01-15T10-30-00",
    "snapshot2Id": "2025-01-16T14-45-00"
  }
  ```

## Configuration

### Memory Settings
For large websites, you may need to increase Node.js memory:
```bash
node --max-old-space-size=4096 server.js
```

### Crawl Depth
Adjust the crawling depth in the archive request:
- `depth: 1` - Only the main page
- `depth: 2` - Main page + directly linked pages
- `depth: 3` - Goes deeper (use with caution)

### Dependencies
- **Backend**: Express.js, Cheerio, Axios, fast-diff
- **Frontend**: React, Vite, Tailwind CSS

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


