import { useEffect, useState } from 'react';

function App() {
  const [apiStatus, setApiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inputUrl, setInputUrl] = useState('');
  const [archivedLink, setArchivedLink] = useState('');
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/api/test')
      .then((res) => res.json())
      .then((data) => {
        setApiStatus(data);
        setLoading(false);
      })
      .catch(() => {
        setApiStatus(null);
        setLoading(false);
      });
  }, []);

  const handleArchive = async () => {
    if (!inputUrl.trim()) return;
    setArchiving(true);
    setArchiveError('');
    setArchivedLink('');

    try {
      const res = await fetch('http://localhost:3000/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl })
      });

      const data = await res.json();

      if (data.snapshotPath) {
        setArchivedLink(`http://localhost:3000${data.snapshotPath}`);
      } else {
        setArchiveError(data.error || 'Failed to archive.');
      }
    } catch (err) {
      setArchiveError('Something went wrong.');
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 px-4 py-8 relative overflow-hidden">
      {/* Animated Blur Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-4 left-1/4 w-86 h-60 bg-green-500/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-pink-500/25 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-indigo-500/25 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Main Content - with backdrop blur */}
      <div className="relative z-10">
        {/* Title Section - Higher up */}
        <div className="text-center mb-12">
          <h1 className="text-7xl md:text-7xl text-yellow-50 text-center font-satoshi py-4">
            Time Machine
          </h1>
        </div>

        {/* Main Content - Centered */}
        <div className="flex flex-col items-center justify-center space-y-6 max-w-md mx-auto">
          {/* Archive Section */}
          <div className="p-6 bg-neutral-800/80 backdrop-blur-sm rounded-lg shadow-lg w-full border border-neutral-700/50">
            <h2 className="text-xl font-semibold text-yellow-50 mb-4">Archive a Website</h2>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full border border-neutral-600 bg-neutral-700/80 backdrop-blur-sm text-yellow-50 placeholder-neutral-400 p-3 rounded mb-4"
            />
            
            {/* Description */}
            <p className="text-neutral-300 text-sm mb-4 leading-relaxed">
              Capture and preserve any website as it appears right now. Our time machine creates a permanent snapshot that you can access anytime, even if the original site changes or disappears.
            </p>
            
            <button
              onClick={handleArchive}
              className="w-full bg-indigo-600/90 hover:bg-indigo-700/90 backdrop-blur-sm text-white py-3 rounded font-medium disabled:opacity-50 transition-colors"
              disabled={archiving}
            >
              {archiving ? 'Archiving...' : 'Archive'}
            </button>

            {archiveError && <div className="text-red-400 text-sm mt-3">{archiveError}</div>}

            {archivedLink && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-yellow-50 mb-2">Snapshot Ready:</h3>
                <a
                  href={archivedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 hover:underline break-all text-sm"
                >
                  {archivedLink}
                </a>
              </div>
            )}
          </div>

          {/* Backend Status Section */}
          <div className="p-6 bg-neutral-800/80 backdrop-blur-sm rounded-lg shadow-lg w-full border border-neutral-700/50">
            <h3 className="text-xl font-semibold text-yellow-50 mb-4">Backend Status</h3>
            {loading ? (
              <span className="text-neutral-400">Loading...</span>
            ) : apiStatus ? (
              <>
                <div className="text-green-400 font-semibold">{apiStatus.message}</div>
                <div className="text-xs text-neutral-500 mt-2">{apiStatus.timestamp}</div>
              </>
            ) : (
              <span className="text-red-400">Could not connect to backend.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
