import { useState, useEffect } from 'react';

const ComparisonModal = ({ isOpen, onClose, snapshots, inputUrl }) => {
  const [selectedSnapshot1, setSelectedSnapshot1] = useState('');
  const [selectedSnapshot2, setSelectedSnapshot2] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedSnapshot1('');
      setSelectedSnapshot2('');
      setComparisonResult(null);
      setError('');
    }
  }, [isOpen]);

  const handleCompare = async () => {
    if (!selectedSnapshot1 || !selectedSnapshot2) {
      setError('Please select two different snapshots to compare');
      return;
    }

    if (selectedSnapshot1 === selectedSnapshot2) {
      setError('Please select two different snapshots');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: inputUrl,
          snapshot1Id: selectedSnapshot1,
          snapshot2Id: selectedSnapshot2
        })
      });

      const data = await response.json();

      if (response.ok) {
        setComparisonResult(data);
      } else {
        setError(data.error || 'Failed to compare snapshots');
      }
    } catch (err) {
      setError('Something went wrong while comparing snapshots');
    } finally {
      setLoading(false);
    }
  };

  const renderChangeItem = (item, type, changeType) => {
    const getChangeColor = (changeType) => {
      switch (changeType) {
        case 'added': return 'text-green-400 bg-green-500/10 border-green-500/20';
        case 'removed': return 'text-red-400 bg-red-500/10 border-red-500/20';
        case 'modified': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
        default: return 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20';
      }
    };

    if (type === 'headings') {
      return (
        <div className={`p-3 rounded-lg border ${getChangeColor(changeType)}`}>
          <div className="font-medium">{item.level?.toUpperCase()} - {item.text}</div>
          {item.id && <div className="text-sm opacity-75">ID: {item.id}</div>}
          {item.classes && <div className="text-sm opacity-75">Classes: {item.classes}</div>}
        </div>
      );
    }

    if (type === 'paragraphs') {
      return (
        <div className={`p-3 rounded-lg border ${getChangeColor(changeType)}`}>
          <div className="text-sm">{item.text?.substring(0, 200)}{item.text?.length > 200 ? '...' : ''}</div>
          {item.classes && <div className="text-sm opacity-75 mt-1">Classes: {item.classes}</div>}
        </div>
      );
    }

    if (type === 'links') {
      return (
        <div className={`p-3 rounded-lg border ${getChangeColor(changeType)}`}>
          <div className="font-medium">{item.text}</div>
          <div className="text-sm opacity-75">{item.href}</div>
          {item.title && <div className="text-sm opacity-75">Title: {item.title}</div>}
        </div>
      );
    }

    if (type === 'images') {
      return (
        <div className={`p-3 rounded-lg border ${getChangeColor(changeType)}`}>
          <div className="font-medium">Image: {item.alt || 'No alt text'}</div>
          <div className="text-sm opacity-75">{item.src}</div>
          {item.title && <div className="text-sm opacity-75">Title: {item.title}</div>}
        </div>
      );
    }

    if (type === 'lists') {
      return (
        <div className={`p-3 rounded-lg border ${getChangeColor(changeType)}`}>
          <div className="font-medium">{item.type?.toUpperCase()} List ({item.items?.length || 0} items)</div>
          <div className="text-sm opacity-75 mt-1">
            {item.items?.slice(0, 3).map((listItem, idx) => (
              <div key={idx}>• {listItem.substring(0, 50)}{listItem.length > 50 ? '...' : ''}</div>
            ))}
            {item.items?.length > 3 && <div>... and {item.items.length - 3} more items</div>}
          </div>
        </div>
      );
    }

    if (type === 'meta') {
      const [name, content] = Array.isArray(item) ? item : [item.name || 'unknown', item.content || ''];
      return (
        <div className={`p-3 rounded-lg border ${getChangeColor(changeType)}`}>
          <div className="font-medium">Meta: {name}</div>
          <div className="text-sm opacity-75">{content}</div>
        </div>
      );
    }

    return (
      <div className={`p-3 rounded-lg border ${getChangeColor(changeType)}`}>
        <pre className="text-sm overflow-x-auto">{JSON.stringify(item, null, 2)}</pre>
      </div>
    );
  };

  // Helper function to show detailed differences for modified items
  const renderModifiedComparison = (oldItem, newItem, type) => {
    // For simple cases where we can show specific differences
    if (type === 'headings') {
      const differences = [];
      if (oldItem.text !== newItem.text) differences.push(`Text: "${oldItem.text}" → "${newItem.text}"`);
      if (oldItem.level !== newItem.level) differences.push(`Level: ${oldItem.level} → ${newItem.level}`);
      if (oldItem.id !== newItem.id) differences.push(`ID: ${oldItem.id || 'none'} → ${newItem.id || 'none'}`);
      if (oldItem.classes !== newItem.classes) differences.push(`Classes: ${oldItem.classes || 'none'} → ${newItem.classes || 'none'}`);
      
      return (
        <div className="p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10">
          <div className="text-yellow-400 font-medium mb-2">Modified Heading</div>
          {differences.map((diff, idx) => (
            <div key={idx} className="text-sm text-yellow-300">{diff}</div>
          ))}
        </div>
      );
    }

    if (type === 'links') {
      const differences = [];
      if (oldItem.text !== newItem.text) differences.push(`Text: "${oldItem.text}" → "${newItem.text}"`);
      if (oldItem.href !== newItem.href) differences.push(`URL: ${oldItem.href} → ${newItem.href}`);
      if (oldItem.title !== newItem.title) differences.push(`Title: ${oldItem.title || 'none'} → ${newItem.title || 'none'}`);
      
      return (
        <div className="p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10">
          <div className="text-yellow-400 font-medium mb-2">Modified Link</div>
          {differences.map((diff, idx) => (
            <div key={idx} className="text-sm text-yellow-300">{diff}</div>
          ))}
        </div>
      );
    }

    if (type === 'images') {
      const differences = [];
      if (oldItem.src !== newItem.src) differences.push(`Source: ${oldItem.src} → ${newItem.src}`);
      if (oldItem.alt !== newItem.alt) differences.push(`Alt text: "${oldItem.alt}" → "${newItem.alt}"`);
      if (oldItem.title !== newItem.title) differences.push(`Title: ${oldItem.title || 'none'} → ${newItem.title || 'none'}`);
      
      return (
        <div className="p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10">
          <div className="text-yellow-400 font-medium mb-2">Modified Image</div>
          {differences.map((diff, idx) => (
            <div key={idx} className="text-sm text-yellow-300">{diff}</div>
          ))}
        </div>
      );
    }

    // For other types, show a side-by-side comparison
    return (
      <div className="space-y-2">
        <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10">
          <div className="text-red-400 text-sm font-medium mb-1">Before:</div>
          {renderChangeItem(oldItem, type, 'removed')}
        </div>
        <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/10">
          <div className="text-green-400 text-sm font-medium mb-1">After:</div>
          {renderChangeItem(newItem, type, 'added')}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-800 rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl border border-neutral-700">
        {/* Header */}
        <div className="p-6 border-b border-neutral-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-yellow-50">Compare Snapshots</h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-yellow-50 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {!comparisonResult ? (
            /* Selection Interface */
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Snapshot 1 Selection */}
                <div>
                  <label className="block text-yellow-50 font-medium mb-3">First Snapshot (Older)</label>
                  <select
                    value={selectedSnapshot1}
                    onChange={(e) => setSelectedSnapshot1(e.target.value)}
                    className="w-full bg-neutral-700 text-yellow-50 border border-neutral-600 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select first snapshot...</option>
                    {snapshots.map((snapshot) => (
                      <option key={snapshot.id} value={snapshot.id}>
                        {snapshot.displayDate}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Snapshot 2 Selection */}
                <div>
                  <label className="block text-yellow-50 font-medium mb-3">Second Snapshot (Newer)</label>
                  <select
                    value={selectedSnapshot2}
                    onChange={(e) => setSelectedSnapshot2(e.target.value)}
                    className="w-full bg-neutral-700 text-yellow-50 border border-neutral-600 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select second snapshot...</option>
                    {snapshots.map((snapshot) => (
                      <option key={snapshot.id} value={snapshot.id}>
                        {snapshot.displayDate}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="text-red-400">{error}</div>
                </div>
              )}

              <button
                onClick={handleCompare}
                disabled={loading || !selectedSnapshot1 || !selectedSnapshot2}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-600 disabled:opacity-50 text-white py-3 px-6 rounded-xl font-medium transition-colors"
              >
                {loading ? 'Comparing...' : 'Compare Snapshots'}
              </button>
            </div>
          ) : (
            /* Comparison Results */
            <div className="p-6">
              {/* Comparison Header */}
              <div className="mb-6 p-4 bg-neutral-700/50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-yellow-50">Comparison Results</h3>
                  <button
                    onClick={() => setComparisonResult(null)}
                    className="text-indigo-400 hover:text-indigo-300 text-sm"
                  >
                    ← Back to Selection
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-neutral-400">Older Snapshot:</div>
                    <div className="text-yellow-50">{comparisonResult.snapshots.snapshot1.displayDate}</div>
                  </div>
                  <div>
                    <div className="text-neutral-400">Newer Snapshot:</div>
                    <div className="text-yellow-50">{comparisonResult.snapshots.snapshot2.displayDate}</div>
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-4 p-3 bg-neutral-600/50 rounded-lg">
                  <div className="text-yellow-50 font-medium mb-2">Summary</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-neutral-400">Total Changes</div>
                      <div className="text-yellow-50 font-medium">{comparisonResult.changes.summary.totalChanges}</div>
                    </div>
                    <div>
                      <div className="text-green-400">Added</div>
                      <div className="text-green-400 font-medium">{comparisonResult.changes.summary.addedElements}</div>
                    </div>
                    <div>
                      <div className="text-red-400">Removed</div>
                      <div className="text-red-400 font-medium">{comparisonResult.changes.summary.removedElements}</div>
                    </div>
                    <div>
                      <div className="text-yellow-400">Modified</div>
                      <div className="text-yellow-400 font-medium">{comparisonResult.changes.summary.modifiedElements}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Changes Details */}
              <div className="space-y-6">
                {/* Title Changes */}
                {comparisonResult.changes.title && (
                  <div>
                    <h4 className="text-lg font-medium text-yellow-50 mb-3">Title Changes</h4>
                    <div className="space-y-2">
                      <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10">
                        <div className="text-red-400 text-sm font-medium">Old:</div>
                        <div className="text-red-400">{comparisonResult.changes.title.old}</div>
                      </div>
                      <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/10">
                        <div className="text-green-400 text-sm font-medium">New:</div>
                        <div className="text-green-400">{comparisonResult.changes.title.new}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content Changes */}
                {Object.entries(comparisonResult.changes).map(([type, changes]) => {
                  if (type === 'title' || type === 'summary' || !changes || typeof changes !== 'object') return null;
                  
                  const hasChanges = changes.added?.length > 0 || changes.removed?.length > 0 || changes.modified?.length > 0;
                  if (!hasChanges) return null;

                  return (
                    <div key={type}>
                      <h4 className="text-lg font-medium text-yellow-50 mb-3 capitalize">
                        {type} Changes
                      </h4>
                      
                      <div className="space-y-4">
                        {/* Added Items */}
                        {changes.added?.length > 0 && (
                          <div>
                            <div className="text-green-400 font-medium mb-2">Added ({changes.added.length})</div>
                            <div className="space-y-2">
                              {changes.added.map((item, index) => (
                                <div key={index}>
                                  {renderChangeItem(item, type, 'added')}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Removed Items */}
                        {changes.removed?.length > 0 && (
                          <div>
                            <div className="text-red-400 font-medium mb-2">Removed ({changes.removed.length})</div>
                            <div className="space-y-2">
                              {changes.removed.map((item, index) => (
                                <div key={index}>
                                  {renderChangeItem(item, type, 'removed')}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Modified Items */}
                        {changes.modified?.length > 0 && (
                          <div>
                            <div className="text-yellow-400 font-medium mb-2">Modified ({changes.modified.length})</div>
                            <div className="space-y-2">
                              {changes.modified.map((item, index) => (
                                <div key={index} className="space-y-1">
                                  {renderModifiedComparison(item.old, item.new, type)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {comparisonResult.changes.summary.totalChanges === 0 && (
                  <div className="text-center py-8">
                    <div className="text-neutral-400 text-lg">No differences found between these snapshots</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal; 