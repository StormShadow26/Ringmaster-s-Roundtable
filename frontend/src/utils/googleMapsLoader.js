// utils/googleMapsLoader.js
// Global Google Maps API loader to prevent duplicate loading

class GoogleMapsLoader {
  constructor() {
    this.loading = false;
    this.loaded = false;
    this.callbacks = [];
    this.error = null;
  }

  async loadGoogleMaps(apiKey) {
    // If already loaded, return immediately
    if (this.isFullyLoaded()) {
      console.log('✅ Google Maps already loaded');
      return Promise.resolve();
    }

    // If currently loading, add to callback queue
    if (this.loading) {
      console.log('⏳ Google Maps already loading, queuing callback');
      return new Promise((resolve, reject) => {
        this.callbacks.push({ resolve, reject });
      });
    }

    // Start loading
    this.loading = true;
    console.log('🚀 Starting Google Maps API load');

    return new Promise((resolve, reject) => {
      this.callbacks.push({ resolve, reject });

      // Remove existing scripts
      this.removeExistingScripts();

      // Create unique callback name
      const callbackName = `googleMapsInit_${Date.now()}`;
      
      // Set up callback
      window[callbackName] = () => {
        console.log('✅ Google Maps callback triggered');
        
        if (this.isFullyLoaded()) {
          this.loaded = true;
          this.loading = false;
          this.resolveAll();
        } else {
          const error = new Error('Google Maps API loaded but components missing');
          this.error = error;
          this.loading = false;
          this.rejectAll(error);
        }
        
        delete window[callbackName];
      };

      // Create script
      const script = document.createElement('script');
      script.id = 'google-maps-api-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&v=weekly&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      
      script.onerror = () => {
        const error = new Error('Failed to load Google Maps API script');
        this.error = error;
        this.loading = false;
        this.rejectAll(error);
        delete window[callbackName];
      };

      // Timeout
      setTimeout(() => {
        if (this.loading) {
          const error = new Error('Google Maps API loading timeout');
          this.error = error;
          this.loading = false;
          this.rejectAll(error);
          delete window[callbackName];
        }
      }, 20000);

      document.head.appendChild(script);
    });
  }

  isFullyLoaded() {
    return !!(
      window.google && 
      window.google.maps && 
      window.google.maps.Map && 
      window.google.maps.marker && 
      window.google.maps.marker.AdvancedMarkerElement &&
      window.google.maps.InfoWindow
    );
  }

  removeExistingScripts() {
    // Remove existing Google Maps scripts
    const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    existingScripts.forEach(script => {
      console.log('🗑️ Removing duplicate Google Maps script');
      script.remove();
    });

    // Clean up existing Google object if incomplete
    if (window.google && !this.isFullyLoaded()) {
      console.log('🧹 Cleaning incomplete Google Maps objects');
      delete window.google;
    }
  }

  resolveAll() {
    this.callbacks.forEach(callback => callback.resolve());
    this.callbacks = [];
  }

  rejectAll(error) {
    this.callbacks.forEach(callback => callback.reject(error));
    this.callbacks = [];
  }

  reset() {
    this.loading = false;
    this.loaded = false;
    this.error = null;
    this.callbacks = [];
    this.removeExistingScripts();
  }
}

// Global singleton instance
export const googleMapsLoader = new GoogleMapsLoader();

// Convenience function
export async function loadGoogleMapsAPI(apiKey) {
  return googleMapsLoader.loadGoogleMaps(apiKey);
}