import React from 'react';

const DebugData = ({ data, label }) => {
  if (!data) {
    return (
      <div className="bg-gray-100 border border-gray-300 p-4 rounded mb-4">
        <h3 className="font-bold text-gray-600">{label}</h3>
        <p className="text-red-500">No data provided</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 border border-gray-300 p-4 rounded mb-4">
      <h3 className="font-bold text-gray-600">{label}</h3>
      <div className="mt-2">
        <p className="text-sm"><strong>Type:</strong> {typeof data}</p>
        <p className="text-sm"><strong>Is Array:</strong> {Array.isArray(data) ? 'Yes' : 'No'}</p>
        {typeof data === 'object' && (
          <p className="text-sm"><strong>Keys:</strong> {Object.keys(data).join(', ')}</p>
        )}
        <details className="mt-2">
          <summary className="cursor-pointer text-sm font-semibold">Raw Data (Click to expand)</summary>
          <pre className="text-xs bg-white p-2 mt-2 rounded overflow-auto max-h-40">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default DebugData;