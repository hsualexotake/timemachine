import { useEffect, useState } from 'react';
import ComparisonModal from './components/ComparisonModal';

function App() {
  const [apiStatus, setApiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inputUrl, setInputUrl] = useState('');
  const [archivedLink, setArchivedLink] = useState('');
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState('');
  const [existingSnapshots, setExistingSnapshots] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [fetchingSnapshots, setFetchingSnapshots] = useState(false);
  const [appError, setAppError] = useState(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Error boundary effect
  useEffect(() => {
    const handleError = (error) => {
      console.error('React error caught:', error);
      setAppError(error.message);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('existingSnapshots state:', existingSnapshots, 'type:', typeof existingSnapshots, 'isArray:', Array.isArray(existingSnapshots));
  }, [existingSnapshots]);

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

  const fetchExistingSnapshots = async (url) => {
    if (!url.trim()) return;
    
    setFetchingSnapshots(true);
    setExistingSnapshots([]); // Reset to empty array first
    
    try {
      const res = await fetch(`http://localhost:3000/api/snapshots?url=${encodeURIComponent(url)}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setExistingSnapshots(data);
      } else {
        console.error('API returned non-array data:', data);
        setExistingSnapshots([]);
      }
    } catch (err) {
      console.error('Failed to fetch snapshots:', err);
      setExistingSnapshots([]);
    } finally {
      setFetchingSnapshots(false);
    }
  };

  const handleViewSnapshots = async () => {
    if (!inputUrl.trim()) return;
    await fetchExistingSnapshots(inputUrl);
    setShowDropdown(true);
  };

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
        // Refresh snapshots after successful archive
        await fetchExistingSnapshots(inputUrl);
      } else {
        setArchiveError(data.error || 'Failed to archive.');
      }
    } catch (err) {
      setArchiveError('Something went wrong.');
    } finally {
      setArchiving(false);
    }
  };

  const handleCompareSnapshots = () => {
    if (existingSnapshots.length < 2) {
      return; // Need at least 2 snapshots to compare
    }
    setShowComparisonModal(true);
  };

  if (appError) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-red-400 mb-4">Application Error</h1>
          <p className="text-neutral-400">{appError}</p>
          <button 
            onClick={() => {setAppError(null); window.location.reload();}} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 px-4 py-8 relative overflow-hidden">
      {/* Single Blur Background - aligned with card */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl h-96 bg-gradient-to-br from-indigo-400/30 via-violet-400/20 to-fuchsia-400/25 rounded-3xl blur-3xl"></div>
      </div>

      {/* Main Content - with backdrop blur */}
      <div className="relative z-10">
        {/* Title Section - Higher up */}
        <div className="text-center mb-12">
          <h1 className="text-7xl md:text-7xl text-yellow-50 text-center font-satoshi py-4">
          Internet Archive
          </h1>
        </div>

        {/* Main Content - Centered */}
        <div className="flex flex-col items-center justify-center space-y-6 max-w-3xl mx-auto">
          {/* Archive Section */}
          <div className="bg-neutral-800/90 backdrop-blur-sm rounded-3xl shadow-2xl w-full overflow-visible border border-neutral-700/30">
            {/* Main Card Content */}
            <div className="p-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-semibold text-yellow-50">Capture, View, and Compare</h2>
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
                        <span className="text-green-400 text-base">Connected - Ready</span>
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
              
              <div className="flex space-x-4 relative mb-6">
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
                
                <div className="relative">
                  <button
                    onClick={handleViewSnapshots}
                    className="bg-neutral-600/80 hover:bg-neutral-500/80 backdrop-blur-sm text-yellow-50 py-4 px-8 rounded-2xl font-medium transition-colors flex items-center justify-center space-x-2 text-lg disabled:opacity-50"
                    disabled={!inputUrl.trim() || fetchingSnapshots}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>{fetchingSnapshots ? 'Loading...' : 'View Existing'}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {archivedLink && (
                    <button
                      onClick={() => navigator.clipboard.writeText(archivedLink)}
                      className="absolute left-full ml-4 bg-neutral-600/80 hover:bg-neutral-500/80 backdrop-blur-sm text-yellow-50 py-4 px-8 rounded-2xl font-medium transition-colors flex items-center justify-center"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Dropdown Menu - moved outside button container */}
              {showDropdown && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowDropdown(false)}
                  ></div>
                  
                  <div className="relative z-20 mb-6">
                    <div className="bg-neutral-700/90 backdrop-blur-sm border border-neutral-600/50 rounded-2xl shadow-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-yellow-50 font-medium text-lg">Existing Snapshots</h4>
                        {existingSnapshots.length >= 2 && (
                          <button
                            onClick={handleCompareSnapshots}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span>Compare</span>
                          </button>
                        )}
                      </div>
                      {(() => {
                        try {
                          const snapshots = Array.isArray(existingSnapshots) ? existingSnapshots : [];
                          
                          if (snapshots.length === 0) {
                            return <p className="text-neutral-400 text-base py-6 text-center">No snapshots found for this URL</p>;
                          }
                          
                          return (
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                              {snapshots.map((snapshot, index) => (
                                <a
                                  key={snapshot.id || index}
                                  href={`http://localhost:3000${snapshot.snapshotPath}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block p-4 bg-neutral-600/50 hover:bg-neutral-500/50 rounded-xl transition-colors group"
                                  onClick={() => setShowDropdown(false)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="text-yellow-50 text-base font-medium group-hover:text-yellow-100">
                                        {snapshot.displayDate || snapshot.id || `Snapshot ${index + 1}`}
                                      </div>
                                      <div className="text-neutral-400 text-sm mt-1">
                                        Click to view snapshot
                                      </div>
                                    </div>
                                    <svg className="w-5 h-5 text-neutral-400 group-hover:text-yellow-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </div>
                                </a>
                              ))}
                            </div>
                          );
                        } catch (renderError) {
                          console.error('Error rendering snapshots:', renderError);
                          return <p className="text-red-400 text-base py-6 text-center">Error displaying snapshots</p>;
                        }
                      })()}
                    </div>
                  </div>
                </>
              )}

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
            
            {/* Status Bar - shows when archiving is complete OR when viewing existing snapshots */}
            {(archivedLink || (showDropdown && Array.isArray(existingSnapshots) && existingSnapshots.length > 0)) && (
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 px-12 py-6 rounded-b-3xl">
                <div className="flex items-center justify-center space-x-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-white font-medium text-base">
                    {archivedLink ? 'Successfully Archived' : `${existingSnapshots.length} Snapshot${existingSnapshots.length !== 1 ? 's' : ''} Found`}
                  </span>
                </div>
              </div>
            )}

            {/* Red Status Bar - shows when no snapshots exist */}
            {showDropdown && Array.isArray(existingSnapshots) && existingSnapshots.length === 0 && (
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-12 py-6 rounded-b-3xl">
                <div className="flex items-center justify-center space-x-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-white font-medium text-base">No Existing Snapshots Found</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Description moved below */}
          <div className="text-center max-w-2xl">
            <p className="text-neutral-400 text-base leading-relaxed">
              Capture and preserve any website. The time machine creates a permanent snapshot that you can access anytime, even if the original site changes or disappears.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Modal */}
      <ComparisonModal
        isOpen={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        snapshots={existingSnapshots}
        inputUrl={inputUrl}
      />
    </div>
  );
}

export default App;
