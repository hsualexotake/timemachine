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
        <div className="flex flex-col items-center justify-center space-y-6 max-w-2xl mx-auto">
          {/* Archive Section */}
          <div className="bg-neutral-800/90 backdrop-blur-sm rounded-3xl shadow-2xl w-full overflow-hidden border border-neutral-700/30">
            {/* Main Card Content */}
            <div className="p-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-semibold text-yellow-50">Archive Website</h2>
                <div className="text-neutral-400 text-base">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
              
              <div className="flex items-center space-x-4 mb-8">
                <div>
                  <h3 className="text-yellow-50 font-medium text-lg">Time Machine</h3>
                  <div className="flex items-center space-x-2">
                    {loading ? (
                      <>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                        <span className="text-yellow-400 text-base">Connecting...</span>
                      </>
                    ) : apiStatus ? (
                      <>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span className="text-green-400 text-base">Connected to Backend - Ready to Archive</span>
                      </>
                    ) : (
                      <>
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <span className="text-red-400 text-base">Not connected to backend</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full border border-neutral-600 bg-neutral-700/80 backdrop-blur-sm text-yellow-50 placeholder-neutral-400 p-5 rounded-2xl mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-lg"
              />
              
              <div className="flex space-x-4">
                <button
                  onClick={handleArchive}
                  className="flex-1 bg-neutral-600/80 hover:bg-neutral-500/80 backdrop-blur-sm text-yellow-50 py-4 px-8 rounded-2xl font-medium disabled:opacity-50 transition-colors flex items-center justify-center space-x-3 text-lg"
                  disabled={archiving || !apiStatus}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>{archiving ? 'Archiving...' : 'Capture Snapshot'}</span>
                </button>
                
                {archivedLink && (
                  <button
                    onClick={() => navigator.clipboard.writeText(archivedLink)}
                    className="bg-neutral-600/80 hover:bg-neutral-500/80 backdrop-blur-sm text-yellow-50 py-4 px-8 rounded-2xl font-medium transition-colors flex items-center justify-center"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                )}
              </div>

              {archiveError && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="text-red-400 text-base">{archiveError}</div>
                </div>
              )}

              {archivedLink && (
                <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <h3 className="text-base font-medium text-green-400 mb-2">Snapshot Ready:</h3>
                  <a
                    href={archivedLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 hover:underline break-all text-base"
                  >
                    {archivedLink}
                  </a>
                </div>
              )}
            </div>
            
            {/* Green Status Bar - shows when archiving is complete */}
            {archivedLink && (
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 px-12 py-6">
                <div className="flex items-center justify-center space-x-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-white font-medium text-base">Successfully Archived</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Description moved below */}
          <div className="text-center max-w-2xl">
            <p className="text-neutral-400 text-base leading-relaxed">
              Capture and preserve any website as it appears right now. Our time machine creates a permanent snapshot that you can access anytime, even if the original site changes or disappears.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
