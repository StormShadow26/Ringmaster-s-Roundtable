import React, { useEffect, useRef, useState, useCallback } from 'react';

const RobustTravelMap = ({ city, locations = [], coordinates }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStep, setLoadingStep] = useState('initializing');

  console.log('🗺️ RobustTravelMap rendered with:', { 
    city, 
    locationsCount: Array.isArray(locations) ? locations.length : 'not array',
    coordinates 
  });

  // Memoized callback for when Google Maps loads
  const handleMapLoad = useCallback(() => {
    console.log('📍 Google Maps API loaded callback triggered');
    if (window.google && window.google.maps) {
      setLoadingStep('api-ready');
      setIsLoaded(true);
    } else {
      console.error('❌ Callback fired but Google Maps API not available');
      setError('API loaded but Google Maps not available');
    }
  }, []);

  // Load Google Maps API
  useEffect(() => {
    let checkInterval;
    let timeoutId;
    
    setLoadingStep('checking-existing');
    
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      console.log('✅ Google Maps API already available');
      setIsLoaded(true);
      setLoadingStep('api-ready');
      return;
    }

    // Check if script is already loading
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('📜 Google Maps script already exists, waiting for load...');
      setLoadingStep('script-waiting');
      
      // More aggressive checking for existing script
      checkInterval = setInterval(() => {
        console.log('🔍 Checking Google Maps availability...', {
          hasGoogle: !!window.google,
          hasMaps: !!(window.google && window.google.maps),
          hasMap: !!(window.google && window.google.maps && window.google.maps.Map)
        });
        
        if (window.google && window.google.maps && window.google.maps.Map) {
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
          console.log('✅ Google Maps fully loaded!');
          setIsLoaded(true);
          setLoadingStep('api-ready');
        }
      }, 200);
      
      // Increase timeout to 15 seconds for slower connections
      timeoutId = setTimeout(() => {
        clearInterval(checkInterval);
        console.error('❌ Google Maps loading timeout');
        setError('Google Maps script exists but failed to load within timeout');
      }, 15000);
      
      return () => {
        if (checkInterval) clearInterval(checkInterval);
        if (timeoutId) clearTimeout(timeoutId);
      };
    }

    // Load the API fresh
    setLoadingStep('loading-api');
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('❌ No Google Maps API key found');
      setError('Google Maps API key not configured');
      return;
    }

    console.log('🔑 API Key found, loading Google Maps fresh...');
    
    // Simple approach - no custom callback, just check for availability
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('📜 Google Maps script loaded, checking API...');
      
      // Start checking for API availability
      checkInterval = setInterval(() => {
        console.log('🔍 Checking post-load availability...', {
          hasGoogle: !!window.google,
          hasMaps: !!(window.google && window.google.maps),
          hasMap: !!(window.google && window.google.maps && window.google.maps.Map)
        });
        
        if (window.google && window.google.maps && window.google.maps.Map) {
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
          console.log('✅ Google Maps API fully ready!');
          setIsLoaded(true);
          setLoadingStep('api-ready');
        }
      }, 200);
      
      timeoutId = setTimeout(() => {
        clearInterval(checkInterval);
        console.error('❌ Google Maps API not ready after script load');
        setError('Google Maps script loaded but API not available');
      }, 10000);
    };
    
    script.onerror = (error) => {
      console.error('❌ Failed to load Google Maps script:', error);
      setError('Failed to load Google Maps API script');
    };

    document.head.appendChild(script);
    console.log('📡 Fresh Google Maps script added to page');

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (timeoutId) clearTimeout(timeoutId);
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize map when ready
  useEffect(() => {
    if (!isLoaded || !coordinates || !mapRef.current) {
      console.log('⏳ Waiting for map initialization requirements:', {
        isLoaded,
        hasCoordinates: !!coordinates,
        hasMapRef: !!mapRef.current
      });
      return;
    }

    setLoadingStep('creating-map');
    console.log('🚀 Initializing map with coordinates:', coordinates);

    try {
      // Validate coordinates
      const lat = parseFloat(coordinates.lat);
      const lng = parseFloat(coordinates.lon || coordinates.lng);
      
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error(`Invalid coordinates: lat=${lat}, lng=${lng}`);
      }

      console.log('📍 Creating map at:', { lat, lng });

      // Create map
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: { lat, lng },
        mapTypeId: window.google.maps.MapTypeId.ROADMAP
      });

      // Add city marker (larger, red marker for the main destination)
      const cityMarker = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstance,
        title: `${city || 'Location'} - Main Destination`,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(40, 40)
        },
        zIndex: 1000 // Ensure city marker appears above attraction markers
      });

      // Add info window for city marker
      const cityInfo = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; text-align: center;">
            <h3 style="margin: 0 0 8px 0; color: #dc2626; font-size: 18px;">📍 ${city || 'Location'}</h3>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Main Travel Destination</p>
            <p style="margin: 4px 0 0 0; color: #9ca3af; font-size: 12px;">
              ${lat.toFixed(6)}, ${lng.toFixed(6)}
            </p>
          </div>
        `
      });

      cityMarker.addListener('click', () => {
        cityInfo.open(mapInstance, cityMarker);
      });

      console.log('✅ Map and city marker created successfully');
      setMap(mapInstance);
      setLoadingStep('complete');

      // Add attraction markers if available
      if (Array.isArray(locations) && locations.length > 0) {
        console.log(`📍 Adding ${locations.length} attraction markers`);
        
        const bounds = new window.google.maps.LatLngBounds();
        const cityLatLng = new window.google.maps.LatLng(lat, lng);
        bounds.extend(cityLatLng);

        locations.forEach((attraction, index) => {
          try {
            // Try different coordinate formats
            let attractionLat, attractionLng;
            
            if (attraction.geometry?.location?.lat && attraction.geometry?.location?.lng) {
              // Google Places API format
              attractionLat = parseFloat(attraction.geometry.location.lat);
              attractionLng = parseFloat(attraction.geometry.location.lng);
            } else if (attraction.lat && attraction.lng) {
              // Direct lat/lng format
              attractionLat = parseFloat(attraction.lat);
              attractionLng = parseFloat(attraction.lng);
            } else if (attraction.coordinates?.lat && attraction.coordinates?.lng) {
              // Nested coordinates format
              attractionLat = parseFloat(attraction.coordinates.lat);
              attractionLng = parseFloat(attraction.coordinates.lng);
            } else {
              console.warn(`❌ No valid coordinates for attraction: ${attraction.name}`);
              return;
            }

            if (isNaN(attractionLat) || isNaN(attractionLng)) {
              console.warn(`❌ Invalid coordinates for attraction: ${attraction.name}`, { attractionLat, attractionLng });
              return;
            }

            const attractionLatLng = new window.google.maps.LatLng(attractionLat, attractionLng);
            bounds.extend(attractionLatLng);

            // Create attraction marker with custom icon
            const marker = new window.google.maps.Marker({
              position: { lat: attractionLat, lng: attractionLng },
              map: mapInstance,
              title: attraction.name || `Attraction ${index + 1}`,
              icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new window.google.maps.Size(32, 32)
              }
            });

            // Create info window for attraction
            const attractionInfo = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 10px; max-width: 250px;">
                  <h4 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${attraction.name || 'Unnamed Attraction'}</h4>
                  ${attraction.rating ? `<div style="color: #f59e0b; margin-bottom: 4px;">⭐ ${attraction.rating}/5</div>` : ''}
                  ${attraction.vicinity || attraction.formatted_address ? `<p style="margin: 4px 0; color: #6b7280; font-size: 12px;">${attraction.vicinity || attraction.formatted_address}</p>` : ''}
                  ${attraction.types && attraction.types.length > 0 ? `<div style="margin: 6px 0; font-size: 11px; color: #9ca3af;">${attraction.types.slice(0, 3).join(', ')}</div>` : ''}
                  ${attraction.user_ratings_total ? `<div style="font-size: 11px; color: #9ca3af;">${attraction.user_ratings_total} reviews</div>` : ''}
                </div>
              `
            });

            marker.addListener('click', () => {
              attractionInfo.open(mapInstance, marker);
            });

            console.log(`✅ Added marker for: ${attraction.name} at (${attractionLat}, ${attractionLng})`);

          } catch (error) {
            console.error(`❌ Failed to add marker for attraction ${attraction.name}:`, error);
          }
        });

        // Fit map to show all markers
        if (locations.length > 0) {
          setTimeout(() => {
            mapInstance.fitBounds(bounds);
            // Ensure minimum zoom level
            const listener = window.google.maps.event.addListener(mapInstance, "idle", function() {
              if (mapInstance.getZoom() > 15) mapInstance.setZoom(15);
              window.google.maps.event.removeListener(listener);
            });
          }, 100);
        }

        console.log(`✅ Added ${locations.length} attraction markers and adjusted map bounds`);
      }

    } catch (error) {
      console.error('❌ Map initialization failed:', error);
      setError(`Map initialization failed: ${error.message}`);
    }
  }, [isLoaded, coordinates, city, locations]);

  // Validate coordinates first
  if (!coordinates) {
    return (
      <div className="w-full h-80 bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📍</div>
          <p className="text-lg font-medium">No Location Data</p>
          <p className="text-sm">Coordinates not provided</p>
        </div>
      </div>
    );
  }

  if (!coordinates.lat || (!coordinates.lon && !coordinates.lng)) {
    return (
      <div className="w-full h-80 bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-lg font-medium">Invalid Coordinates</p>
          <p className="text-sm">Missing latitude or longitude</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full h-80 bg-red-50 rounded-lg flex items-center justify-center border border-red-200">
        <div className="text-center p-4">
          <div className="text-red-500 text-4xl mb-2">🚨</div>
          <p className="text-lg font-medium text-red-700">Map Load Failed</p>
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button 
            onClick={() => {
              console.log('🔄 Manual retry triggered');
              setError(null);
              setIsLoaded(false);
              setLoadingStep('manual-retry');
              // Force re-run the effect
              window.location.reload();
            }}
            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 mb-2"
          >
            🔄 Retry
          </button>
          <details className="text-xs text-left">
            <summary className="cursor-pointer text-red-700 hover:text-red-900">Debug Info</summary>
            <div className="mt-2 text-red-600 space-y-1">
              <div>Step: {loadingStep}</div>
              <div>Coordinates: {JSON.stringify(coordinates)}</div>
              <div>Has window.google: {String(!!window.google)}</div>
              <div>Has google.maps: {String(!!(window.google && window.google.maps))}</div>
              <div>Has google.maps.Map: {String(!!(window.google && window.google.maps && window.google.maps.Map))}</div>
              <div>Script exists: {String(!!document.querySelector('script[src*="maps.googleapis.com"]'))}</div>
              <div>API Key: {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing'}</div>
            </div>
          </details>
        </div>
      </div>
    );
  }

  // Show loading state
  if (!isLoaded) {
    return (
      <div className="w-full h-80 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-blue-700">Loading Map</p>
          <p className="text-sm text-blue-600">Step: {loadingStep}</p>
        </div>
      </div>
    );
  }

  // Render map
  return (
    <div className="w-full">
      
      <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden shadow-md">
        <div 
          ref={mapRef} 
          className="w-full h-full"
          style={{ minHeight: '320px' }}
        />
        
        {/* Map overlay info */}
        <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded px-2 py-1 text-xs text-gray-600">
          {city} • {Array.isArray(locations) ? locations.length : 0} locations
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-500 text-center">
        Click the red marker for location details
      </div>
    </div>
  );
};

export default RobustTravelMap;