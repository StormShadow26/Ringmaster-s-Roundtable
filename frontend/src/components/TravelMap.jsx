import React, { useEffect, useRef, useState } from 'react';

const TravelMap = ({ city, locations, coordinates }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Load Google Maps API
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
    };
    
    script.onerror = () => {
      setError('Failed to load Google Maps');
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize map and markers
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !coordinates) return;

    try {
      // Initialize map centered on the city
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: { lat: coordinates.lat, lng: coordinates.lon },
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "on" }]
          }
        ]
      });

      setMap(mapInstance);

      // Create markers for all locations
      const newMarkers = [];
      const bounds = new window.google.maps.LatLngBounds();

      // Add city center marker
      const cityMarker = new window.google.maps.Marker({
        position: { lat: coordinates.lat, lng: coordinates.lon },
        map: mapInstance,
        title: `${city} - City Center`,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(40, 40)
        }
      });

      const cityInfoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 200px;">
            <h3 style="margin: 0 0 5px 0; color: #1f2937; font-size: 16px;">${city}</h3>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">City Center</p>
          </div>
        `
      });

      cityMarker.addListener('click', () => {
        cityInfoWindow.open(mapInstance, cityMarker);
      });

      bounds.extend({ lat: coordinates.lat, lng: coordinates.lon });
      newMarkers.push(cityMarker);

      // Add markers for each location category
      const categoryColors = {
        'outdoor': 'green',
        'indoor': 'blue', 
        'heritage': 'purple',
        'adventure': 'orange',
        'nightlife': 'pink',
        'beaches': 'ltblue'
      };

      // Process all location categories
      Object.entries(locations).forEach(([category, places]) => {
        if (!places || places.length === 0) return;

        const color = categoryColors[category] || 'blue';
        
        places.forEach((place, index) => {
          if (!place || typeof place !== 'string') return;

          // Use Places API to get exact coordinates for each location
          const service = new window.google.maps.places.PlacesService(mapInstance);
          
          const request = {
            query: `${place} ${city}`,
            fields: ['name', 'geometry', 'place_id', 'formatted_address']
          };

          service.textSearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results[0]) {
              const location = results[0];
              const position = location.geometry.location;

              const marker = new window.google.maps.Marker({
                position: position,
                map: mapInstance,
                title: place,
                icon: {
                  url: `https://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
                  scaledSize: new window.google.maps.Size(32, 32)
                }
              });

              const infoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div style="padding: 10px; min-width: 200px;">
                    <h3 style="margin: 0 0 5px 0; color: #1f2937; font-size: 16px;">${location.name}</h3>
                    <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 500;">${category}</p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">${location.formatted_address || place}</p>
                    <div style="margin-top: 8px;">
                      <a href="https://www.google.com/maps/place/${encodeURIComponent(location.name + ' ' + city)}" 
                         target="_blank" 
                         style="color: #3b82f6; text-decoration: none; font-size: 14px;">
                        View on Google Maps →
                      </a>
                    </div>
                  </div>
                `
              });

              marker.addListener('click', () => {
                infoWindow.open(mapInstance, marker);
              });

              bounds.extend(position);
              newMarkers.push(marker);
            }
          });
        });
      });

      setMarkers(newMarkers);

      // Fit map to show all markers after a short delay
      setTimeout(() => {
        if (bounds.isEmpty() === false) {
          mapInstance.fitBounds(bounds);
          
          // Ensure minimum zoom level
          const listener = window.google.maps.event.addListener(mapInstance, 'idle', () => {
            if (mapInstance.getZoom() > 15) {
              mapInstance.setZoom(15);
            }
            window.google.maps.event.removeListener(listener);
          });
        }
      }, 2000);

    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map');
    }
  }, [isLoaded, city, locations, coordinates]);

  // Show loading state
  if (!isLoaded && !error) {
    return (
      <div className="w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-2">🗺️</div>
          <p className="text-gray-600 text-sm">{error}</p>
          <p className="text-xs text-gray-500 mt-1">Check Google Maps API key</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Map Legend */}
      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Map Legend</h4>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>City Center</span>
          </div>
          {Object.entries(locations).map(([category, places]) => {
            if (!places || places.length === 0) return null;
            const colors = {
              'outdoor': 'bg-green-500',
              'indoor': 'bg-blue-500',
              'heritage': 'bg-purple-500', 
              'adventure': 'bg-orange-500',
              'nightlife': 'bg-pink-500',
              'beaches': 'bg-cyan-500'
            };
            return (
              <div key={category} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${colors[category] || 'bg-gray-500'}`}></div>
                <span className="capitalize">{category} ({places.length})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden shadow-lg">
        <div ref={mapRef} className="w-full h-full" />
        
        {/* Map Controls Overlay */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-2">
          <div className="text-xs text-gray-600 text-center">
            <div className="font-semibold">{city}</div>
            <div>{Object.values(locations).flat().length} locations</div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-2 text-xs text-gray-600 text-center">
        <p>Click markers for details • Red = City Center</p>
      </div>
    </div>
  );
};

export default TravelMap;