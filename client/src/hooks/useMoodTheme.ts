import { useState, useEffect } from 'react';

export type RecordingMood = 
  | 'emergency'      // Red theme - high urgency traffic stops, arrests
  | 'caution'        // Orange theme - routine traffic stops, warnings
  | 'documentation'  // Blue theme - evidence gathering, routine recording
  | 'legal'          // Purple theme - court evidence, formal documentation
  | 'calm'           // Green theme - community interactions, positive encounters
  | 'neutral';       // Gray theme - default state

export interface MoodTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  icon: string;
  gradient: string;
  shadow: string;
}

export const MOOD_THEMES: Record<RecordingMood, MoodTheme> = {
  emergency: {
    primary: '#dc2626',     // Red-600
    secondary: '#ef4444',   // Red-500
    accent: '#fca5a5',      // Red-300
    background: '#fef2f2',  // Red-50
    surface: '#fee2e2',     // Red-100
    text: '#7f1d1d',        // Red-900
    textSecondary: '#991b1b', // Red-800
    border: '#fca5a5',      // Red-300
    icon: '#dc2626',        // Red-600
    gradient: 'from-red-600 to-red-700',
    shadow: 'shadow-red-200'
  },
  caution: {
    primary: '#ea580c',     // Orange-600
    secondary: '#f97316',   // Orange-500
    accent: '#fed7aa',      // Orange-200
    background: '#fff7ed',  // Orange-50
    surface: '#ffedd5',     // Orange-100
    text: '#9a3412',        // Orange-800
    textSecondary: '#c2410c', // Orange-700
    border: '#fed7aa',      // Orange-200
    icon: '#ea580c',        // Orange-600
    gradient: 'from-orange-600 to-orange-700',
    shadow: 'shadow-orange-200'
  },
  documentation: {
    primary: '#2563eb',     // Blue-600
    secondary: '#3b82f6',   // Blue-500
    accent: '#93c5fd',      // Blue-300
    background: '#eff6ff',  // Blue-50
    surface: '#dbeafe',     // Blue-100
    text: '#1e3a8a',        // Blue-800
    textSecondary: '#1d4ed8', // Blue-700
    border: '#93c5fd',      // Blue-300
    icon: '#2563eb',        // Blue-600
    gradient: 'from-blue-600 to-blue-700',
    shadow: 'shadow-blue-200'
  },
  legal: {
    primary: '#7c3aed',     // Violet-600
    secondary: '#8b5cf6',   // Violet-500
    accent: '#c4b5fd',      // Violet-300
    background: '#f5f3ff',  // Violet-50
    surface: '#ede9fe',     // Violet-100
    text: '#4c1d95',        // Violet-800
    textSecondary: '#5b21b6', // Violet-700
    border: '#c4b5fd',      // Violet-300
    icon: '#7c3aed',        // Violet-600
    gradient: 'from-violet-600 to-violet-700',
    shadow: 'shadow-violet-200'
  },
  calm: {
    primary: '#059669',     // Emerald-600
    secondary: '#10b981',   // Emerald-500
    accent: '#86efac',      // Green-300
    background: '#ecfdf5',  // Green-50
    surface: '#d1fae5',     // Green-100
    text: '#064e3b',        // Emerald-800
    textSecondary: '#047857', // Emerald-700
    border: '#86efac',      // Green-300
    icon: '#059669',        // Emerald-600
    gradient: 'from-emerald-600 to-emerald-700',
    shadow: 'shadow-green-200'
  },
  neutral: {
    primary: '#4b5563',     // Gray-600
    secondary: '#6b7280',   // Gray-500
    accent: '#d1d5db',      // Gray-300
    background: '#f9fafb',  // Gray-50
    surface: '#f3f4f6',     // Gray-100
    text: '#1f2937',        // Gray-800
    textSecondary: '#374151', // Gray-700
    border: '#d1d5db',      // Gray-300
    icon: '#4b5563',        // Gray-600
    gradient: 'from-gray-600 to-gray-700',
    shadow: 'shadow-gray-200'
  }
};

export interface UseMoodThemeOptions {
  defaultMood?: RecordingMood;
  autoDetect?: boolean;
  emergencyKeywords?: string[];
}

export function useMoodTheme(options: UseMoodThemeOptions = {}) {
  const {
    defaultMood = 'neutral',
    autoDetect = true,
    emergencyKeywords = ['emergency', 'urgent', 'arrest', 'stop', 'pulled over', 'help']
  } = options;

  const [currentMood, setCurrentMood] = useState<RecordingMood>(defaultMood);
  const [theme, setTheme] = useState<MoodTheme>(MOOD_THEMES[defaultMood]);

  // Update theme when mood changes
  useEffect(() => {
    setTheme(MOOD_THEMES[currentMood]);
    
    // Apply CSS custom properties for dynamic theming
    const root = document.documentElement;
    const moodTheme = MOOD_THEMES[currentMood];
    
    root.style.setProperty('--mood-primary', moodTheme.primary);
    root.style.setProperty('--mood-secondary', moodTheme.secondary);
    root.style.setProperty('--mood-accent', moodTheme.accent);
    root.style.setProperty('--mood-background', moodTheme.background);
    root.style.setProperty('--mood-surface', moodTheme.surface);
    root.style.setProperty('--mood-text', moodTheme.text);
    root.style.setProperty('--mood-text-secondary', moodTheme.textSecondary);
    root.style.setProperty('--mood-border', moodTheme.border);
    root.style.setProperty('--mood-icon', moodTheme.icon);
  }, [currentMood]);

  // Auto-detect mood based on context
  const detectMood = (context: {
    isEmergency?: boolean;
    recordingTitle?: string;
    location?: string;
    timeOfDay?: 'day' | 'night';
    voiceCommand?: string;
  }): RecordingMood => {
    if (!autoDetect) return currentMood;

    const { isEmergency, recordingTitle = '', voiceCommand = '' } = context;

    // Check for emergency indicators
    if (isEmergency) return 'emergency';

    // Check for emergency keywords in title or voice command
    const content = `${recordingTitle} ${voiceCommand}`.toLowerCase();
    if (emergencyKeywords.some(keyword => content.includes(keyword))) {
      return 'emergency';
    }

    // Check for traffic stop indicators
    if (content.includes('traffic') || content.includes('pulled over') || content.includes('stop')) {
      return 'caution';
    }

    // Check for legal documentation
    if (content.includes('court') || content.includes('evidence') || content.includes('legal')) {
      return 'legal';
    }

    // Check for positive interactions
    if (content.includes('community') || content.includes('positive') || content.includes('friendly')) {
      return 'calm';
    }

    // Default to documentation for regular recording
    return 'documentation';
  };

  // Manual mood setting
  const setMood = (mood: RecordingMood) => {
    setCurrentMood(mood);
  };

  // Auto-detect and set mood based on context
  const updateMoodFromContext = (context: Parameters<typeof detectMood>[0]) => {
    const detectedMood = detectMood(context);
    setCurrentMood(detectedMood);
    return detectedMood;
  };

  // Get CSS classes for current mood
  const getMoodClasses = () => ({
    container: `bg-[var(--mood-background)] border-[var(--mood-border)]`,
    surface: `bg-[var(--mood-surface)] border-[var(--mood-border)]`,
    primary: `bg-[var(--mood-primary)] text-white`,
    secondary: `bg-[var(--mood-secondary)] text-white`,
    accent: `bg-[var(--mood-accent)] text-[var(--mood-text)]`,
    text: `text-[var(--mood-text)]`,
    textSecondary: `text-[var(--mood-text-secondary)]`,
    border: `border-[var(--mood-border)]`,
    gradient: `bg-gradient-to-r ${theme.gradient}`,
    shadow: theme.shadow,
    icon: `text-[var(--mood-icon)]`
  });

  // Get inline styles for complex components
  const getMoodStyles = () => ({
    primary: { backgroundColor: theme.primary, color: 'white' },
    secondary: { backgroundColor: theme.secondary, color: 'white' },
    accent: { backgroundColor: theme.accent, color: theme.text },
    background: { backgroundColor: theme.background },
    surface: { backgroundColor: theme.surface },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    border: { borderColor: theme.border },
    icon: { color: theme.icon }
  });

  return {
    currentMood,
    theme,
    setMood,
    updateMoodFromContext,
    detectMood,
    getMoodClasses,
    getMoodStyles,
    availableMoods: Object.keys(MOOD_THEMES) as RecordingMood[]
  };
}