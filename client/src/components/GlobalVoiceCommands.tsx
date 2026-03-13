import React from 'react';

/**
 * Global Voice Commands Component - DISABLED
 * Voice listener has been disabled to prevent cycling issues
 */
export function GlobalVoiceCommands() {
  // Voice commands completely disabled
  const isSupported = false;

  if (!isSupported) {
    return null; // Don't show if not supported
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg max-w-sm">
      {/* Voice Status Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isListening ? (
            <Mic className="w-4 h-4 text-green-500 animate-pulse" />
          ) : (
            <MicOff className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Voice Commands
          </span>
        </div>
        
        <button
          onClick={toggleListening}
          className={`p-1 rounded-full ${
            isListening 
              ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
              : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
          }`}
          title={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? (
            <Volume2 className="w-3 h-3" />
          ) : (
            <VolumeX className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Status Information */}
      <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span>Status:</span>
          <Badge variant={isListening ? "default" : "secondary"} className="text-xs">
            {isListening ? 'Listening' : 'Standby'}
          </Badge>
        </div>



        {/* Last Command */}
        {lastCommand && (
          <div className="flex items-center justify-between">
            <span>Last:</span>
            <Badge variant="secondary" className="text-xs">
              {lastCommand}
            </Badge>
          </div>
        )}

        {/* Current Transcript */}
        {transcript && isListening && (
          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
            <span className="text-gray-500 dark:text-gray-400">Hearing: </span>
            <span className="text-gray-700 dark:text-gray-300">{transcript}</span>
          </div>
        )}


      </div>

      {/* Quick Command Reference */}
      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div className="font-medium">Say These Commands:</div>
          <div>• "Emergency" - Start recording</div>
          <div>• "Record" - Go to recording</div>
          <div>• "Home" - Go to dashboard</div>
          <div>• "Rights" - Show legal rights</div>
          <div>• "Help" - Voice commands page</div>
        </div>
      </div>
    </div>
  );
}