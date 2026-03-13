// Temporarily disabled to fix infinite loading loop
export function useRealTimeSync() {
  return {
    isConnected: false,
    getConnectionStatus: () => 'disconnected'
  };
}