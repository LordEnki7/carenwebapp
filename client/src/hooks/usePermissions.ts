import { useState, useEffect } from 'react';

export function usePermissions() {
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');

  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      // Check if permissions API is available
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicPermission(permission.state);
        
        permission.addEventListener('change', () => {
          setMicPermission(permission.state);
        });
      } else {
        // Fallback: try to access microphone directly
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          setMicPermission('granted');
        } catch (error) {
          setMicPermission('denied');
        }
      }
    } catch (error) {
      console.log('Permission check failed:', error);
      setMicPermission('prompt');
    }
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      return true;
    } catch (error) {
      setMicPermission('denied');
      return false;
    }
  };

  return {
    micPermission,
    requestMicrophonePermission,
    checkMicrophonePermission
  };
}