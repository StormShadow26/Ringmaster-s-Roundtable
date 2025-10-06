import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsAPI } from '../utils/googleMapsLoader.js';

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

  // Load Google Maps API using centralized loader (prevents duplicates)
  useEffect(() => {
    const initializeGoogleMaps = async () => {
      setLoadingStep('checking-api-key');
      
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('❌ No Google Maps API key found');
        setError('Google Maps API key not configured');
        return;
      }

      try {
        setLoadingStep('loading-google-maps');
        console.log('🚀 Loading Google Maps API via centralized loader...');
        
        await loadGoogleMapsAPI(apiKey);
        
        console.log('✅ Google Maps API fully loaded and ready!');
        setIsLoaded(true);
        setLoadingStep('api-ready');
        
      } catch (error) {
        console.error('❌ Failed to load Google Maps:', error);
        setError(`Google Maps loading failed: ${error.message}`);
      }
    };

    initializeGoogleMaps();
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
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        mapId: 'DEMO_MAP_ID' // Required for AdvancedMarkerElement
      });

      // Add city marker (using modern AdvancedMarkerElement)
      const cityMarkerElement = document.createElement('div');
      cityMarkerElement.innerHTML = `
        <div style="
          background: #dc2626;
          width: 40px;
          height: 40px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-size: 16px;
            font-weight: bold;
          ">📍</div>
        </div>
      `;
      
      const cityMarker = new window.google.maps.marker.AdvancedMarkerElement({
        position: { lat, lng },
        map: mapInstance,
        title: `${city || 'Location'} - Main Destination`,
        content: cityMarkerElement,
        zIndex: 1000
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
      
      // Add hover effect for city marker
      cityMarkerElement.addEventListener('mouseenter', () => {
        cityMarkerElement.querySelector('div').style.transform = 'rotate(-45deg) scale(1.1)';
      });
      
      cityMarkerElement.addEventListener('mouseleave', () => {
        cityMarkerElement.querySelector('div').style.transform = 'rotate(-45deg) scale(1)';
      });

      console.log('✅ Map and city marker created successfully');
      setMap(mapInstance);
      setLoadingStep('complete');

      // ✨ ENHANCED: Add attraction markers with comprehensive tracking
      if (Array.isArray(locations) && locations.length > 0) {
        console.log(`🎯 STARTING: Adding ${locations.length} attraction markers to map`);
        console.log('📊 Attractions data preview:', locations.map(loc => ({
          name: loc.name,
          hasCoords: !!(loc.geometry?.location || loc.lat || loc.coordinates),
          source: loc.source
        })));
        
        const bounds = new window.google.maps.LatLngBounds();
        const cityLatLng = new window.google.maps.LatLng(lat, lng);
        bounds.extend(cityLatLng);
        
        let successfullyAddedMarkers = 0;
        let failedMarkers = 0;

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

            // ✨ ENHANCED: Create attraction marker with modern AdvancedMarkerElement
            const attractionMarkerElement = document.createElement('div');
            attractionMarkerElement.innerHTML = `
              <div style="
                background: #2563eb;
                width: 32px;
                height: 32px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
              " class="attraction-marker">
                <div style="
                  transform: rotate(45deg);
                  color: white;
                  font-size: 12px;
                ">🎯</div>
              </div>
            `;
            
            const marker = new window.google.maps.marker.AdvancedMarkerElement({
              position: { lat: attractionLat, lng: attractionLng },
              map: mapInstance,
              title: `${attraction.name || `Attraction ${index + 1}`} (Click for details)`,
              content: attractionMarkerElement,
              zIndex: 500 + index
            });

            // ✨ ENHANCED: Create comprehensive info window for attraction
            const attractionInfo = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 12px; max-width: 280px; font-family: Arial, sans-serif;">
                  <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin-bottom: 8px;">
                    <h4 style="margin: 0; color: #1f2937; font-size: 17px; font-weight: bold;">
                      🎯 ${attraction.name || 'Unnamed Attraction'}
                    </h4>
                  </div>
                  
                  ${attraction.rating ? `
                    <div style="margin-bottom: 6px; display: flex; align-items: center;">
                      <span style="color: #f59e0b; font-size: 14px; font-weight: bold;">⭐ ${attraction.rating}/5</span>
                      ${attraction.user_ratings_total || attraction.reviews ? `
                        <span style="color: #6b7280; font-size: 12px; margin-left: 8px;">
                          (${attraction.user_ratings_total || attraction.reviews} reviews)
                        </span>
                      ` : ''}
                    </div>
                  ` : ''}
                  
                  ${attraction.category ? `
                    <div style="margin-bottom: 6px;">
                      <span style="background: #eff6ff; color: #1d4ed8; font-size: 11px; padding: 2px 6px; border-radius: 12px;">
                        ${attraction.category}
                      </span>
                    </div>
                  ` : ''}
                  
                  ${attraction.vicinity || attraction.formatted_address ? `
                    <p style="margin: 6px 0; color: #6b7280; font-size: 12px; line-height: 1.4;">
                      📍 ${attraction.vicinity || attraction.formatted_address}
                    </p>
                  ` : ''}
                  
                  ${attraction.description ? `
                    <p style="margin: 6px 0; color: #4b5563; font-size: 12px; line-height: 1.4; font-style: italic;">
                      ${attraction.description}
                    </p>
                  ` : ''}
                  
                  ${attraction.types && attraction.types.length > 0 ? `
                    <div style="margin: 8px 0; font-size: 10px; color: #9ca3af;">
                      🏷️ ${attraction.types.slice(0, 3).map(type => type.replace(/_/g, ' ')).join(' • ')}
                    </div>
                  ` : ''}
                  
                  <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; text-align: center;">
                    Source: ${attraction.source || 'Google Places'} | Coordinates: ${attractionLat.toFixed(4)}, ${attractionLng.toFixed(4)}
                  </div>
                </div>
              `,
              maxWidth: 300
            });

            // ✨ ENHANCED: Add interactive marker behaviors for AdvancedMarkerElement
            marker.addListener('click', () => {
              // Close any open info windows
              if (window.currentInfoWindow) {
                window.currentInfoWindow.close();
              }
              // Open this attraction's info window
              attractionInfo.open(mapInstance, marker);
              window.currentInfoWindow = attractionInfo;
              
              // Optional: Center map on clicked attraction
              mapInstance.panTo({ lat: attractionLat, lng: attractionLng });
              
              console.log(`🖱️ User clicked on: ${attraction.name}`);
            });

            // ✨ ENHANCED: Add hover effects using DOM manipulation
            const markerElement = attractionMarkerElement.querySelector('.attraction-marker');
            
            attractionMarkerElement.addEventListener('mouseenter', () => {
              markerElement.style.background = '#7c3aed';
              markerElement.style.transform = 'rotate(-45deg) scale(1.1)';
              markerElement.style.zIndex = '1000';
            });

            attractionMarkerElement.addEventListener('mouseleave', () => {
              markerElement.style.background = '#2563eb';
              markerElement.style.transform = 'rotate(-45deg) scale(1)';
              markerElement.style.zIndex = '500';
            });

            console.log(`✅ Added interactive marker for: ${attraction.name} at (${attractionLat}, ${attractionLng})`);
            successfullyAddedMarkers++;

          } catch (error) {
            console.error(`❌ Failed to add marker for attraction ${attraction.name}:`, error);
            failedMarkers++;
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

        // ✨ ENHANCED: Summary logging and user feedback
        console.log(`🎯 COMPLETED: Successfully added ${successfullyAddedMarkers} markers, ${failedMarkers} failed`);
        console.log(`📍 Map bounds adjusted to show all ${successfullyAddedMarkers + 1} locations (city + attractions)`);
        
        // Update loading step to show completion with stats
        setLoadingStep(`complete-with-${successfullyAddedMarkers}-attractions`);
        
      } else if (Array.isArray(locations) && locations.length === 0) {
        console.log('ℹ️ No attractions provided for map display');
        setLoadingStep('complete-no-attractions');
      } else {
        console.log('⚠️ Invalid or missing attractions data for map');
        setLoadingStep('complete-invalid-data');
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
              <div>Has AdvancedMarkerElement: {String(!!(window.google && window.google.maps && window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement))}</div>
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
      {/* ✨ ENHANCED: Attraction Summary Header */}
      <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🗺️</span>
            <div>
              <h3 className="font-semibold text-gray-800">{city} Travel Map</h3>
              <p className="text-sm text-gray-600">
                {Array.isArray(locations) ? locations.length : 0} attractions pinned on map
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1">
            <div className="flex items-center space-x-1 text-xs">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Main Destination</span>
            </div>
            <div className="flex items-center space-x-1 text-xs">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Tourist Attractions</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden shadow-lg border">
        <div 
          ref={mapRef} 
          className="w-full h-full"
          style={{ minHeight: '384px' }}
        />
        
        {/* ✨ ENHANCED: Dynamic Map overlay with attraction count */}
        <div className="absolute top-3 left-3 bg-white bg-opacity-95 rounded-lg px-3 py-2 shadow-md border">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-lg">📍</span>
            <div>
              <div className="font-semibold text-gray-800">{city}</div>
              <div className="text-xs text-gray-600">
                {Array.isArray(locations) ? locations.length : 0} attractions found
              </div>
            </div>
          </div>
        </div>

        {/* ✨ ENHANCED: Loading indicator overlay */}
        {loadingStep !== 'complete' && !loadingStep.startsWith('complete-') && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <div className="text-sm font-medium text-gray-700">Loading Map...</div>
              <div className="text-xs text-gray-500">{loadingStep}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* ✨ ENHANCED: Interactive instructions */}
      <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 text-center">
        💡 <strong>Click any marker</strong> to see attraction details • <strong>Drag</strong> to explore the area
      </div>

      {/* ✨ ENHANCED: Attractions List for Reference */}
      {Array.isArray(locations) && locations.length > 0 && (
        <div className="mt-4 mb-6 p-3 bg-white rounded-lg border shadow-sm">
          <h4 className="font-medium text-gray-800 mb-2 flex items-center">
            <span className="text-lg mr-2">🎯</span>
            Pinned Attractions ({locations.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-28 overflow-y-auto">
            {locations.map((attraction, index) => (
              <div key={index} className="flex items-center space-x-2 text-xs p-1 hover:bg-gray-50 rounded">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <span className="font-medium truncate">{attraction.name || `Attraction ${index + 1}`}</span>
                {attraction.rating && (
                  <span className="text-yellow-600 ml-auto">⭐{attraction.rating}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RobustTravelMap;