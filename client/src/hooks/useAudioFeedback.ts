import { useState, useEffect, useCallback } from 'react';

export interface AudioFeedbackSettings {
  enabled: boolean;
  volume: number;
  voiceSpeed: number;
  confirmationStyle: 'brief' | 'detailed' | 'silent';
  emergencyOverride: boolean; // Always play emergency sounds even if disabled
}

export interface AudioFeedbackState {
  settings: AudioFeedbackSettings;
  isPlaying: boolean;
  lastPlayedMessage: string | null;
  supportedVoices: SpeechSynthesisVoice[];
  selectedVoice: string | null;
}

const DEFAULT_SETTINGS: AudioFeedbackSettings = {
  enabled: true,
  volume: 0.8,
  voiceSpeed: 1.0,
  confirmationStyle: 'brief',
  emergencyOverride: true
};

export const useAudioFeedback = () => {
  const [state, setState] = useState<AudioFeedbackState>(() => {
    const savedSettings = localStorage.getItem('caren_audio_feedback');
    const parsedSettings = savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;
    
    return {
      settings: { ...DEFAULT_SETTINGS, ...parsedSettings },
      isPlaying: false,
      lastPlayedMessage: null,
      supportedVoices: [],
      selectedVoice: null
    };
  });

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      const englishVoices = voices.filter(voice => 
        voice.lang.startsWith('en') && !voice.name.includes('Google')
      );
      
      setState(prev => ({
        ...prev,
        supportedVoices: englishVoices,
        selectedVoice: prev.selectedVoice || (englishVoices[0]?.name || null)
      }));
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('caren_audio_feedback', JSON.stringify(state.settings));
  }, [state.settings]);

  const updateSettings = useCallback((newSettings: Partial<AudioFeedbackSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  }, []);

  const playAudioFeedback = useCallback((
    message: string, 
    options: {
      type?: 'action' | 'emergency' | 'navigation' | 'legal' | 'recording';
      priority?: 'low' | 'medium' | 'high' | 'critical';
      forcePlay?: boolean;
    } = {}
  ) => {
    const { type = 'action', priority = 'medium', forcePlay = false } = options;
    
    // Check if audio feedback is enabled or if it's an emergency override
    if (!state.settings.enabled && !forcePlay && 
        !(type === 'emergency' && state.settings.emergencyOverride)) {
      return Promise.resolve();
    }

    // Don't play if confirmation style is silent (unless emergency)
    if (state.settings.confirmationStyle === 'silent' && type !== 'emergency' && !forcePlay) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      // Stop any current speech
      speechSynthesis.cancel();
      
      setState(prev => ({ ...prev, isPlaying: true, lastPlayedMessage: message }));

      const utterance = new SpeechSynthesisUtterance();
      
      // Set message based on confirmation style
      let finalMessage = message;
      if (state.settings.confirmationStyle === 'brief' && type !== 'emergency') {
        finalMessage = getBriefMessage(message, type);
      }
      
      utterance.text = finalMessage;
      utterance.volume = state.settings.volume;
      utterance.rate = state.settings.voiceSpeed;
      
      // Set voice if available
      if (state.selectedVoice) {
        const voice = state.supportedVoices.find(v => v.name === state.selectedVoice);
        if (voice) utterance.voice = voice;
      }

      // Emergency priority handling
      if (type === 'emergency' || priority === 'critical') {
        utterance.volume = Math.max(0.9, state.settings.volume);
        utterance.rate = Math.max(0.8, state.settings.voiceSpeed - 0.2);
      }

      utterance.onend = () => {
        setState(prev => ({ ...prev, isPlaying: false }));
        resolve();
      };

      utterance.onerror = () => {
        setState(prev => ({ ...prev, isPlaying: false }));
        resolve();
      };

      speechSynthesis.speak(utterance);
    });
  }, [state.settings, state.selectedVoice, state.supportedVoices]);

  const getBriefMessage = (message: string, type: string): string => {
    const briefMessages: { [key: string]: string } = {
      'Recording started': 'Recording',
      'Recording stopped': 'Stopped',
      'Emergency activated': 'Emergency active',
      'Emergency contacts notified': 'Contacts notified',
      'GPS location captured': 'Location captured',
      'Attorney message sent': 'Message sent',
      'Legal rights displayed': 'Rights shown',
      'Voice command activated': 'Command activated',
      'Settings saved': 'Saved',
      'Emergency pullover initiated': 'Pullover mode',
      'Police encounter mode activated': 'Encounter mode'
    };

    return briefMessages[message] || message.split(' ').slice(0, 2).join(' ');
  };

  const playConfirmation = useCallback((action: string) => {
    return playAudioFeedback(`${action} confirmed`, { type: 'action' });
  }, [playAudioFeedback]);

  const playEmergencyAlert = useCallback((message: string) => {
    return playAudioFeedback(message, { 
      type: 'emergency', 
      priority: 'critical',
      forcePlay: true 
    });
  }, [playAudioFeedback]);

  const playNavigationFeedback = useCallback((destination: string) => {
    return playAudioFeedback(`Navigating to ${destination}`, { type: 'navigation' });
  }, [playAudioFeedback]);

  const playLegalFeedback = useCallback((rightsInfo: string) => {
    return playAudioFeedback(rightsInfo, { type: 'legal' });
  }, [playAudioFeedback]);

  const playRecordingFeedback = useCallback((status: 'started' | 'stopped' | 'paused') => {
    const messages = {
      started: 'Recording started',
      stopped: 'Recording stopped',
      paused: 'Recording paused'
    };
    return playAudioFeedback(messages[status], { type: 'recording' });
  }, [playAudioFeedback]);

  const testAudioFeedback = useCallback(() => {
    return playAudioFeedback('Audio feedback test - C.A.R.E.N.™ voice confirmation system is working', {
      type: 'action',
      forcePlay: true
    });
  }, [playAudioFeedback]);

  const setSelectedVoice = useCallback((voiceName: string) => {
    setState(prev => ({ ...prev, selectedVoice: voiceName }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setState(prev => ({
      ...prev,
      settings: { ...DEFAULT_SETTINGS }
    }));
  }, []);

  return {
    settings: state.settings,
    isPlaying: state.isPlaying,
    lastPlayedMessage: state.lastPlayedMessage,
    supportedVoices: state.supportedVoices,
    selectedVoice: state.selectedVoice,
    updateSettings,
    playAudioFeedback,
    playConfirmation,
    playEmergencyAlert,
    playNavigationFeedback,
    playLegalFeedback,
    playRecordingFeedback,
    testAudioFeedback,
    setSelectedVoice,
    resetToDefaults
  };
};