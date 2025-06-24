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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <h1 className="text-3xl md:text-4xl font-bold text-indigo-700 mb-4 text-center">
        🕰️ TimeMachine Snapshot Tool
      </h1>

      <div className="p-4 bg-white rounded shadow w-full max-w-md space-y-4">
        <h2 className="text-xl font-semibold">Archive a Website</h2>
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full border border-gray-300 p-2 rounded text-black"
        />
        <button
          onClick={handleArchive}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded disabled:opacity-50"
          disabled={archiving}
        >
          {archiving ? 'Archiving...' : 'Archive'}
        </button>

        {archiveError && <div className="text-red-500 text-sm">{archiveError}</div>}

        {archivedLink && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Snapshot Ready:</h3>
            <a
              href={archivedLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {archivedLink}
            </a>
          </div>
        )}
      </div>

      <div className="p-4 mt-6 bg-white rounded shadow text-center w-full max-w-md">
        <h3 className="font-bold mb-2">Backend Status</h3>
        {loading ? (
          <span className="text-gray-500">Loading...</span>
        ) : apiStatus ? (
          <>
            <div className="text-green-600 font-semibold">{apiStatus.message}</div>
            <div className="text-xs text-gray-400 mt-1">{apiStatus.timestamp}</div>
          </>
        ) : (
          <span className="text-red-500">Could not connect to backend.</span>
        )}
      </div>
    </div>
  );
}

export default App;
