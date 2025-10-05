import React, { useEffect, useState } from 'react';

const SimpleMapDebugger = () => {
  const [status, setStatus] = useState('Starting...');
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message, type };
    console.log(`[${timestamp}] ${message}`);
    setLogs(prev => [...prev, logEntry]);
  };

  const testGoogleMaps = async () => {
    addLog('🔄 Starting Google Maps test...');
    setStatus('Testing Google Maps API...');

    // Step 1: Check environment
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      addLog('❌ No API key found in environment', 'error');
      setStatus('❌ Missing API key');
      return;
    }
    addLog(`✅ API key found: ${apiKey.substring(0, 10)}...`);

    // Step 2: Check existing script
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      addLog('📜 Google Maps script already exists');
      
      // Check if API is available
      if (window.google && window.google.maps && window.google.maps.Map) {
        addLog('✅ Google Maps API already loaded and ready!');
        setStatus('✅ API Ready');
        return;
      } else {
        addLog('⚠️ Script exists but API not ready, removing...');
        existingScript.remove();
      }
    }

    // Step 3: Load fresh script
    addLog('📡 Loading fresh Google Maps script...');
    setStatus('Loading Google Maps...');
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    // Set up monitoring
    const checkInterval = setInterval(() => {
      const hasGoogle = !!window.google;
      const hasMaps = !!(window.google && window.google.maps);
      const hasMap = !!(window.google && window.google.maps && window.google.maps.Map);
      
      addLog(`🔍 Checking: google=${hasGoogle}, maps=${hasMaps}, Map=${hasMap}`);
      
      if (hasMap) {
        clearInterval(checkInterval);
        addLog('✅ Google Maps API fully loaded!', 'success');
        setStatus('✅ API Ready - Test Complete');
      }
    }, 500);

    // Timeout after 20 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      addLog('❌ Timeout waiting for Google Maps API', 'error');
      setStatus('❌ Loading timeout');
    }, 20000);

    script.onload = () => {
      addLog('📜 Script loaded, waiting for API initialization...');
    };

    script.onerror = (error) => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
      addLog(`❌ Script loading failed: ${error}`, 'error');
      setStatus('❌ Script load failed');
    };

    document.head.appendChild(script);
    addLog('📡 Script added to document head');

    // Cleanup function
    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  };

  useEffect(() => {
    const cleanup = testGoogleMaps();
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">🧪 Google Maps API Debugger</h2>
      
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <div className="text-sm font-medium text-blue-900">Status:</div>
        <div className="text-blue-700">{status}</div>
      </div>

      <div className="mb-4">
        <button
          onClick={() => {
            setLogs([]);
            setStatus('Restarting...');
            testGoogleMaps();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          🔄 Run Test Again
        </button>
      </div>

      <div className="bg-gray-50 border rounded p-3">
        <div className="text-sm font-medium text-gray-700 mb-2">Test Log:</div>
        <div className="max-h-64 overflow-y-auto text-xs font-mono">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`mb-1 ${
                log.type === 'error' ? 'text-red-600' :
                log.type === 'success' ? 'text-green-600' :
                'text-gray-700'
              }`}
            >
              [{log.timestamp}] {log.message}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <div className="text-sm font-medium text-yellow-800 mb-1">Quick Environment Check:</div>
        <div className="text-xs text-yellow-700 space-y-1">
          <div>API Key: {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? '✅ Present' : '❌ Missing'}</div>
          <div>Google object: {window.google ? '✅ Exists' : '❌ Not found'}</div>
          <div>Google Maps: {window.google?.maps ? '✅ Available' : '❌ Not available'}</div>
          <div>Map constructor: {window.google?.maps?.Map ? '✅ Ready' : '❌ Not ready'}</div>
        </div>
      </div>
    </div>
  );
};

export default SimpleMapDebugger;