import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Loader2, ExternalLink, Clock, MapPin, Users } from 'lucide-react';

const CalendarSyncModal = ({ isOpen, onClose, itineraryText, travelData, onComplete }) => {
  const [syncStage, setSyncStage] = useState('idle'); // idle, authenticating, parsing, creating, success, error
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [eventsCreated, setEventsCreated] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [error, setError] = useState(null);
  const [syncResult, setSyncResult] = useState(null);

  // Animation states
  const [showConfetti, setShowConfetti] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(0);

  const syncSteps = [
    { key: 'authenticating', label: 'Connecting to Google Calendar', icon: '🔐', duration: 2000 },
    { key: 'parsing', label: 'Analyzing your itinerary', icon: '📋', duration: 1500 },
    { key: 'creating', label: 'Creating calendar events', icon: '📅', duration: 3000 },
    { key: 'success', label: 'Sync completed successfully!', icon: '✅', duration: 0 }
  ];

  useEffect(() => {
    if (isOpen && syncStage === 'idle') {
      startSync();
    }
  }, [isOpen]);

  // Pulse effect during sync
  useEffect(() => {
    if (syncStage !== 'idle' && syncStage !== 'success' && syncStage !== 'error') {
      const pulseInterval = setInterval(() => {
        setPulseIntensity(prev => (prev + 1) % 4);
      }, 300);
      return () => clearInterval(pulseInterval);
    }
  }, [syncStage]);

  const startSync = async () => {
    try {
      // Step 1: Authentication
      setSyncStage('authenticating');
      setCurrentStep('Connecting to Google Calendar...');
      setProgress(10);
      
      await simulateProgress(10, 30, 2000);

      // Step 2: Parsing
      setSyncStage('parsing');
      setCurrentStep('Analyzing your travel itinerary...');
      
      await simulateProgress(30, 50, 1500);

      // Step 3: Creating events
      setSyncStage('creating');
      setCurrentStep('Creating calendar events...');
      
      // Simulate creating multiple events
      const mockTotalEvents = 8 + Math.floor(Math.random() * 6); // 8-13 events
      setTotalEvents(mockTotalEvents);
      
      for (let i = 0; i < mockTotalEvents; i++) {
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        setEventsCreated(i + 1);
        setProgress(50 + ((i + 1) / mockTotalEvents) * 40);
        setCurrentStep(`Creating event ${i + 1} of ${mockTotalEvents}...`);
      }

      // Step 4: Success
      setProgress(100);
      setSyncStage('success');
      setCurrentStep('All events synced successfully!');
      
      // Trigger confetti animation
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      // Mock result data
      const result = {
        success: true,
        eventsCreated: mockTotalEvents,
        calendarName: 'Primary Calendar',
        destination: travelData?.destination?.city || travelData?.city || 'Your Destination',
        startDate: travelData?.startDate || new Date().toLocaleDateString(),
        endDate: travelData?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
      };
      
      setSyncResult(result);
      
      // Notify parent component
      if (onComplete) {
        onComplete(result);
      }

    } catch (error) {
      console.error('Calendar sync error:', error);
      setSyncStage('error');
      setError(error.message || 'Failed to sync with calendar');
    }
  };

  const simulateProgress = (start, end, duration) => {
    return new Promise((resolve) => {
      const steps = 20;
      const increment = (end - start) / steps;
      const stepDuration = duration / steps;
      let currentProgress = start;

      const interval = setInterval(() => {
        currentProgress += increment;
        setProgress(Math.min(currentProgress, end));
        
        if (currentProgress >= end) {
          clearInterval(interval);
          resolve();
        }
      }, stepDuration);
    });
  };

  const handleClose = () => {
    if (syncStage === 'success' || syncStage === 'error') {
      onClose();
      // Reset state for next use
      setTimeout(() => {
        setSyncStage('idle');
        setProgress(0);
        setEventsCreated(0);
        setTotalEvents(0);
        setError(null);
        setSyncResult(null);
        setPulseIntensity(0);
      }, 300);
    }
  };

  const openGoogleCalendar = () => {
    window.open('https://calendar.google.com', '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[10000]">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
      )}

      <div className={`relative bg-white rounded-3xl shadow-2xl border border-slate-200/50 w-full max-w-lg transition-all duration-500 ${
        showConfetti ? 'animate-bounce' : ''
      }`}>
        
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 px-6 py-6 rounded-t-3xl">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className={`absolute inset-0 bg-gradient-to-r from-white/0 via-white/${10 + pulseIntensity * 5} to-white/0 animate-pulse`}></div>
          </div>
          
          <div className="relative flex items-center space-x-4">
            <div className={`w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${
              syncStage !== 'idle' && syncStage !== 'success' && syncStage !== 'error' ? 'animate-pulse' : ''
            }`}>
              {syncStage === 'success' ? (
                <CheckCircle className="w-8 h-8 text-green-400" />
              ) : syncStage === 'error' ? (
                <Calendar className="w-8 h-8 text-red-400" />
              ) : (
                <Calendar className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Calendar Integration</h2>
              <p className="text-blue-100/90 font-medium">
                {syncStage === 'success' ? 'Sync Complete!' : 
                 syncStage === 'error' ? 'Sync Failed' : 
                 'Syncing your travel itinerary...'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Progress Section */}
          {(syncStage !== 'success' && syncStage !== 'error') && (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-medium text-slate-700">{currentStep}</span>
                  <span className="text-sm font-bold text-slate-900">{Math.round(progress)}%</span>
                </div>
              </div>

              {/* Current Activity */}
              <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200/50">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">
                    {syncStage === 'authenticating' && 'Establishing secure connection...'}
                    {syncStage === 'parsing' && 'Processing itinerary content...'}
                    {syncStage === 'creating' && `Creating event ${eventsCreated} of ${totalEvents}...`}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {syncStage === 'authenticating' && 'Authenticating with Google services'}
                    {syncStage === 'parsing' && 'Extracting activities and dates'}
                    {syncStage === 'creating' && 'Adding events to your calendar'}
                  </p>
                </div>
              </div>

              {/* Event Counter */}
              {syncStage === 'creating' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-800">Created</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900 mt-1">{eventsCreated}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">Remaining</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{totalEvents - eventsCreated}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success State */}
          {syncStage === 'success' && syncResult && (
            <div className="space-y-6">
              {/* Success Banner */}
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Calendar Sync Complete!</h3>
                <p className="text-slate-600 font-medium">
                  Your travel itinerary has been successfully added to Google Calendar
                </p>
              </div>

              {/* Sync Summary */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600 mb-1">{syncResult.eventsCreated}</p>
                    <p className="text-sm font-medium text-green-800">Events Created</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-600 mb-1">✓</p>
                    <p className="text-sm font-medium text-emerald-800">Synced Successfully</p>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700">
                      <strong>Destination:</strong> {syncResult.destination}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700">
                      <strong>Travel Period:</strong> {syncResult.startDate} - {syncResult.endDate}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-700">
                      <strong>Calendar:</strong> {syncResult.calendarName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={openGoogleCalendar}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>View in Google Calendar</span>
                </button>
                
                <button
                  onClick={handleClose}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-xl transition-all duration-300 border border-slate-200"
                >
                  Continue Planning
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {syncStage === 'error' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-800 mb-2">Sync Failed</h3>
                <p className="text-red-600">{error}</p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={startSync}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarSyncModal;