import { useEffect, useState } from 'react';

function App() {
  const [apiStatus, setApiStatus] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl md:text-4xl font-bold text-indigo-700 mb-4 text-center">
        Welcome to the TimeMachine Backend!
      </h1>
      <p className="mb-6 text-lg text-gray-700 text-center">
        The API is running.
      </p>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2 text-center">Available Endpoints</h2>
        <ul className="space-y-1 text-center">
          <li><a href="http://localhost:3000/api/test" className="text-blue-600 hover:underline">/api/test</a></li>
          <li><a href="http://localhost:3000/api/snapshots" className="text-blue-600 hover:underline">/api/snapshots</a></li>
          <li><span className="text-gray-600">POST /api/archive</span></li>
        </ul>
      </div>
      <div className="p-4 bg-white rounded shadow text-center w-full max-w-md">
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

  {/* Snapshot Preview Link */}
  <div className="mt-6">
    <h4 className="font-semibold mb-1">Try a Snapshot</h4>
    <a
      href="http://localhost:3000/snapshots/httpbin.org/2025-06-23T21-39-06/index.html"
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline"
    >
      View Snapshot (httpbin.org)
    </a>
  </div>
</div>

    </div>
  );
}

export default App;
