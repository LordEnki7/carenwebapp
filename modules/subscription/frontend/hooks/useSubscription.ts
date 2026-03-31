import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventBus } from '../../../../src/core/EventBus';
import { apiRequest } from '../../../../client/src/lib/queryClient';

interface SubscriptionData {
  planId: string;
  status: 'active' | 'inactive' | 'trial' | 'expired';
  expiresAt?: string;
  features: string[];
  limitations?: string[];
}

export function useSubscription() {
  const queryClient = useQueryClient();
  const [subscriptionState, setSubscriptionState] = useState<{
    currentPlan: string | null;
    isLoading: boolean;
    hasAccess: (feature: string) => boolean;
  }>({
    currentPlan: null,
    isLoading: true,
    hasAccess: () => false
  });

  // Query current subscription
  const { data: subscription, isLoading, error, refetch } = useQuery<SubscriptionData>({
    queryKey: ['/api/subscription/current'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Upgrade subscription mutation
  const upgradeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('POST', '/api/subscription/upgrade', { planId });
      return response;
    },
    onSuccess: (data, planId) => {
      // Emit upgrade success event
      eventBus.emit({
        type: 'subscription.upgrade.success',
        module: '@caren/subscription',
        payload: { planId, data, timestamp: Date.now() }
      });
      
      // Invalidate subscription cache
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
    },
    onError: (error, planId) => {
      eventBus.emit({
        type: 'subscription.upgrade.error',
        module: '@caren/subscription',
        payload: { planId, error: error.message, timestamp: Date.now() }
      });
    }
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/subscription/cancel');
      return response;
    },
    onSuccess: () => {
      eventBus.emit({
        type: 'subscription.cancelled',
        module: '@caren/subscription',
        payload: { timestamp: Date.now() }
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
    },
    onError: (error) => {
      eventBus.emit({
        type: 'subscription.cancel.error',
        module: '@caren/subscription',
        payload: { error: error.message, timestamp: Date.now() }
      });
    }
  });

  // Feature access checker
  const hasAccess = (feature: string): boolean => {
    if (!subscription) return false;
    
    const featureMap: Record<string, string[]> = {
      'basic_recording': ['basic', 'standard', 'premium', 'professional', 'enterprise'],
      'voice_commands': ['standard', 'premium', 'professional', 'enterprise'],
      'attorney_network': ['premium', 'professional', 'enterprise'],
      'live_streaming': ['premium', 'professional', 'enterprise'],
      'bluetooth_hands_free': ['professional', 'enterprise'],
      'ai_legal_assistant': ['professional', 'enterprise'],
      'fleet_management': ['enterprise'],
      'custom_integrations': ['enterprise']
    };

    const allowedPlans = featureMap[feature] || [];
    return allowedPlans.includes(subscription.planId);
  };

  // Update subscription state
  useEffect(() => {
    setSubscriptionState({
      currentPlan: subscription?.planId || null,
      isLoading,
      hasAccess
    });
  }, [subscription, isLoading]);

  // Handle successful subscription load
  useEffect(() => {
    if (subscription) {
      eventBus.emit({
        type: 'subscription.loaded',
        module: '@caren/subscription',
        payload: { 
          planId: subscription.planId, 
          status: subscription.status,
          timestamp: Date.now() 
        }
      });
    }
  }, [subscription]);

  // Handle subscription errors
  useEffect(() => {
    if (error) {
      eventBus.emit({
        type: 'subscription.error',
        module: '@caren/subscription',
        payload: { error: error.message, timestamp: Date.now() }
      });
    }
  }, [error]);

  // Subscribe to external subscription events
  useEffect(() => {
    const handleSubscriptionEvent = (event: any) => {
      console.log(`[SUBSCRIPTION_MODULE] Received event: ${event.type}`, event.payload);
      
      // Refetch subscription data on external changes
      if (event.type === 'subscription.external.update') {
        refetch();
      }
    };

    eventBus.subscribe('subscription.external.update', handleSubscriptionEvent);
    
    return () => {
      eventBus.unsubscribe('subscription.external.update', handleSubscriptionEvent);
    };
  }, [refetch]);

  return {
    ...subscriptionState,
    subscription,
    error,
    refetch,
    upgrade: upgradeMutation.mutate,
    cancel: cancelMutation.mutate,
    isUpgrading: upgradeMutation.isPending,
    isCancelling: cancelMutation.isPending,
    upgradeError: upgradeMutation.error,
    cancelError: cancelMutation.error
  };
}

// Export subscription feature checker for use across modules
export function checkSubscriptionAccess(feature: string, subscription: SubscriptionData | null): boolean {
  if (!subscription) return false;
  
  const featureMap: Record<string, string[]> = {
    'basic_recording': ['basic', 'standard', 'premium', 'professional', 'enterprise'],
    'voice_commands': ['standard', 'premium', 'professional', 'enterprise'],
    'attorney_network': ['premium', 'professional', 'enterprise'],
    'live_streaming': ['premium', 'professional', 'enterprise'],
    'bluetooth_hands_free': ['professional', 'enterprise'],
    'ai_legal_assistant': ['professional', 'enterprise'],
    'fleet_management': ['enterprise'],
    'custom_integrations': ['enterprise']
  };

  const allowedPlans = featureMap[feature] || [];
  return allowedPlans.includes(subscription.planId);
}