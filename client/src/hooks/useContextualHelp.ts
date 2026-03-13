import { useState, useCallback, useContext, createContext, useEffect } from 'react';
import type { ReactNode } from 'react';

interface ContextualHelpState {
  isEnabled: boolean;
  currentContext: {
    page?: string;
    userState?: string;
    currentAction?: string;
    formData?: any;
  };
  isVisible: boolean;
}

interface ContextualHelpContextType {
  state: ContextualHelpState;
  showHelp: () => void;
  hideHelp: () => void;
  toggleHelp: () => void;
  updateContext: (context: Partial<ContextualHelpState['currentContext']>) => void;
  setEnabled: (enabled: boolean) => void;
}

const ContextualHelpContext = createContext<ContextualHelpContextType | undefined>(undefined);

export function ContextualHelpProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContextualHelpState>({
    isEnabled: true,
    currentContext: {},
    isVisible: false
  });

  const showHelp = useCallback(() => {
    setState(prev => ({ ...prev, isVisible: true }));
  }, []);

  const hideHelp = useCallback(() => {
    setState(prev => ({ ...prev, isVisible: false }));
  }, []);

  const toggleHelp = useCallback(() => {
    setState(prev => ({ ...prev, isVisible: !prev.isVisible }));
  }, []);

  const updateContext = useCallback((context: Partial<ContextualHelpState['currentContext']>) => {
    setState(prev => ({
      ...prev,
      currentContext: { ...prev.currentContext, ...context }
    }));
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, isEnabled: enabled }));
  }, []);

  const value = {
    state,
    showHelp,
    hideHelp,
    toggleHelp,
    updateContext,
    setEnabled
  };

  return {
    Provider: ContextualHelpContext.Provider,
    value,
    children
  };
}

export function useContextualHelp() {
  const context = useContext(ContextualHelpContext);
  if (context === undefined) {
    throw new Error('useContextualHelp must be used within a ContextualHelpProvider');
  }
  return context;
}

export function usePageContext(page: string, additionalContext?: any) {
  const { updateContext } = useContextualHelp();
  
  useEffect(() => {
    updateContext({ page, ...additionalContext });
  }, [page, additionalContext, updateContext]);
}