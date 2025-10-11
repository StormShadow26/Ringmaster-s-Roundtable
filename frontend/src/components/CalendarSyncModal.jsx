import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Loader2, ExternalLink, Clock, MapPin, Users } from 'lucide-react';
import GoogleCalendarService from '../services/googleCalendarService';

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
      console.log('🔄 Starting real Google Calendar sync...', {
        hasItineraryText: !!itineraryText,
        hasTravelData: !!travelData,
        itineraryLength: itineraryText?.length,
        travelData: travelData
      });

      // Step 1: Initialize Google Calendar Service
      setSyncStage('authenticating');
      setCurrentStep('Initializing Google Calendar API...');
      setProgress(10);
      
      const initialized = await GoogleCalendarService.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize Google Calendar API. Please check your internet connection.');
      }
      
      setCurrentStep('Requesting Google Calendar permissions...');
      setProgress(20);
      
      // This will show the Google OAuth consent screen
      console.log('🔐 Attempting Google Calendar sign in...');
      
      if (!GoogleCalendarService.clientId) {
        throw new Error('Google Client ID is not configured. Please check your environment variables.');
      }
      
      await GoogleCalendarService.signIn();
      console.log('✅ Google Calendar sign in successful!');
      
      setCurrentStep('Google Calendar access granted!');
      setProgress(40);

      // Step 2: Parsing itinerary
      setSyncStage('parsing');
      setCurrentStep('Analyzing your travel itinerary...');
      setProgress(50);
      
      // Use real parsing from GoogleCalendarService
      const activities = GoogleCalendarService.parseItineraryActivities(itineraryText, travelData);
      
      if (activities.length === 0) {
        throw new Error('No activities found in your itinerary. Please make sure your itinerary contains day-by-day activities.');
      }
      
      setTotalEvents(activities.length);
      setCurrentStep(`Found ${activities.length} activities to sync`);
      setProgress(60);

      // Step 3: Creating events with real Google Calendar API
      setSyncStage('creating');
      setCurrentStep('Creating calendar events...');
      
      let createdCount = 0;
      const createdEvents = [];
      
      for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        setCurrentStep(`Creating "${activity.title.substring(0, 30)}${activity.title.length > 30 ? '...' : ''}"...`);
        
        try {
          const destination = travelData?.destination?.city || travelData?.city || travelData?.destination || 'Travel Destination';
          
          const calendarEvent = await GoogleCalendarService.createCalendarEvent({
            summary: `${activity.title}`,
            description: `${activity.description}\n\nPart of your ${destination} travel itinerary (Day ${activity.day})`,
            location: destination,
            start: {
              dateTime: activity.startTime.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
              dateTime: activity.endTime.toISOString(),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            colorId: '10' // Green color for travel events
          });
          
          if (calendarEvent) {
            createdEvents.push(calendarEvent);
            createdCount++;
          }
          
        } catch (eventError) {
          console.error(`Failed to create event for activity: ${activity.title}`, eventError);
          // Continue with other events even if one fails
        }
        
        setEventsCreated(createdCount);
        setProgress(60 + ((i + 1) / activities.length) * 35);
      }

      if (createdCount === 0) {
        throw new Error('Failed to create any calendar events. Please check your Google Calendar permissions.');
      }

      // Step 4: Success
      setProgress(100);
      setSyncStage('success');
      setCurrentStep(`Successfully synced ${createdCount} events to Google Calendar!`);
      
      // Trigger confetti animation
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      // Real result data
      const result = {
        success: true,
        eventsCreated: createdCount,
        totalActivities: activities.length,
        calendarName: 'Primary Calendar',
        destination: travelData?.destination?.city || travelData?.city || travelData?.destination || 'Your Destination',
        startDate: travelData?.tripDuration?.startDate || activities[0]?.startTime?.toLocaleDateString() || new Date().toLocaleDateString(),
        endDate: travelData?.tripDuration?.endDate || activities[activities.length - 1]?.startTime?.toLocaleDateString() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        events: createdEvents
      };
      
      setSyncResult(result);
      
      // Notify parent component
      if (onComplete) {
        onComplete(result);
      }

    } catch (error) {
      console.error('❌ Real Calendar sync error:', error);
      setSyncStage('error');
      
      let userFriendlyMessage = error.message;
      
      // Handle specific Google API errors
      if (error.message.includes('access_denied')) {
        userFriendlyMessage = 'Calendar access was denied. Please try again and grant permission to access your Google Calendar.';
      } else if (error.message.includes('popup_blocked')) {
        userFriendlyMessage = 'Pop-up was blocked. Please allow pop-ups for this site and try again.';
      } else if (error.message.includes('not configured') || error.message.includes('Client ID')) {
        userFriendlyMessage = 'Google Calendar integration is not properly configured. Please contact support.';
      } else if (error.message.includes('Failed to initialize')) {
        userFriendlyMessage = 'Could not connect to Google services. Please check your internet connection and try again.';
      } else if (error.message.includes('This app needs to be configured')) {
        userFriendlyMessage = 'The Google Calendar integration needs to be set up in Google Cloud Console. Please contact the developer.';
      }
      
      setError(userFriendlyMessage);
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
                  onClick={() => {
                    // Reset state and try again
                    setSyncStage('idle');
                    setProgress(0);
                    setError(null);
                    setTimeout(startSync, 100);
                  }}
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