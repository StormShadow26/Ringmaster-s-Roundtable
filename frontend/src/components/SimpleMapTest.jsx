import React, { useEffect, useRef, useState } from 'react';

const SimpleMapTest = () => {
  const mapRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [map, setMap] = useState(null);

  console.log('🧪 SimpleMapTest component rendered');

  useEffect(() => {
    console.log('🔄 Loading Google Maps API for test...');
    
    if (window.google && window.google.maps) {
      console.log('✅ Google Maps already available');
      setIsLoaded(true);
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    console.log('API Key available:', !!apiKey);
    
    if (!apiKey) {
      setError('No API key found');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Test: Google Maps API loaded');
      setIsLoaded(true);
    };
    
    script.onerror = () => {
      console.error('❌ Test: Failed to load Google Maps');
      setError('Failed to load Google Maps');
    };
    
    document.head.appendChild(script);
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    
    console.log('🗺️ Creating test map...');
    
    try {
      const testCoords = { lat: 15.4989946, lng: 73.8282141 }; // Goa coordinates
      
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: testCoords
      });
      
      new window.google.maps.Marker({
        position: testCoords,
        map: mapInstance,
        title: 'Test Marker - Goa'
      });
      
      setMap(mapInstance);
      console.log('✅ Test map created successfully');
      
    } catch (err) {
      console.error('❌ Test map creation failed:', err);
      setError(`Map creation failed: ${err.message}`);
    }
  }, [isLoaded]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h3 className="font-bold text-red-700">Map Test Failed</h3>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-bold text-blue-700">Loading Map Test...</h3>
        <p className="text-blue-600 text-sm">Please wait while we test Google Maps API</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="font-bold mb-2 text-green-700">✅ Map Test Component</h3>
      <p className="text-sm text-green-600 mb-4">
        Google Maps API loaded successfully. Map status: {map ? 'Created' : 'Initializing'}
      </p>
      <div 
        ref={mapRef} 
        className="w-full h-64 border-2 border-gray-300 rounded"
        style={{ minHeight: '300px' }}
      />
    </div>
  );
};

export default SimpleMapTest;