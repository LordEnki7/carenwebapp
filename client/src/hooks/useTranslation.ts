import { useState, useEffect } from 'react';
import { t, getCurrentLanguage, subscribeToLanguageChange } from '@/lib/i18n';

export function useTranslation() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = subscribeToLanguageChange(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, []);

  return {
    t,
    language: getCurrentLanguage(),
  };
}