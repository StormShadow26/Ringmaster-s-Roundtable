import React, { useState } from 'react';
import { Calendar, ExternalLink } from 'lucide-react';
import CalendarSyncModal from './CalendarSyncModal';

const CalendarSyncButton = ({ itineraryText, travelData, onSyncComplete }) => {
  const [showModal, setShowModal] = useState(false);

  const handleSyncClick = () => {
    console.log('🔍 CalendarSyncButton render check:', {
      hasTravelData: !!travelData,
      hasItineraryText: !!itineraryText,
      itineraryTextLength: itineraryText ? itineraryText.length : 0,
      itineraryPreview: itineraryText ? itineraryText.substring(0, 100) + '...' : 'No text'
    });

    if (!travelData || !itineraryText) {
      console.log('❌ CalendarSyncButton: Missing required data, not opening modal');
      return;
    }

    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleSyncComplete = (result) => {
    console.log('📅 Calendar sync completed in modal:', result);
    
    // Call the parent's completion handler
    if (onSyncComplete) {
      onSyncComplete(result);
    }
    
    // Keep the modal open to show success state
    // User will close it manually after viewing the success message
  };

  // Don't render if no travel data
  if (!travelData || !itineraryText) {
    console.log('❌ CalendarSyncButton: Missing required data, not rendering');
    return null;
  }

  return (
    <>
      {/* Sync Button */}
      <div className="space-y-3">
        <button
          onClick={handleSyncClick}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
        >
          <Calendar className="w-5 h-5" />
          <span>Sync Itinerary with Calendar</span>
          <ExternalLink className="w-4 h-4 opacity-75" />
        </button>

        {/* Info Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-800 mb-1">Calendar Integration</h4>
              <p className="text-blue-700 text-sm mb-2">
                Sync your day-by-day itinerary to Google Calendar for easy access on all your devices.
              </p>
              <ul className="text-blue-600 text-xs space-y-1">
                <li>• Each activity will be added as a separate event</li>
                <li>• Events include location and timing information</li>
                <li>• Requires Google account sign-in permission</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Sync Modal */}
      <CalendarSyncModal
        isOpen={showModal}
        onClose={handleModalClose}
        itineraryText={itineraryText}
        travelData={travelData}
        onComplete={handleSyncComplete}
      />
    </>
  );
};

export default CalendarSyncButton;