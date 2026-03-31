import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Shield, Zap } from 'lucide-react';
import { eventBus } from '../../../../src/core/EventBus';

// Subscription plans data
const subscriptionPlans = [
  {
    id: 'free',
    name: 'Free Trial',
    price: '$0',
    period: '7 days',
    description: 'Try core features with limited usage',
    color: 'bg-gray-500',
    features: [
      'Basic emergency activation',
      '3 incident recordings',
      'Limited legal database access',
      'Basic support'
    ],
    limitations: ['3 recordings only', '7-day limit']
  },
  {
    id: 'basic',
    name: 'Basic Protection',
    price: '$1',
    period: 'one-time',
    description: 'Essential protection for budget-conscious users',
    color: 'bg-blue-500',
    features: [
      'Unlimited emergency activation',
      'Basic incident recording',
      'State-specific legal rights',
      'Email support'
    ],
    popular: false
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '$9.99',
    period: 'month',
    description: 'Most popular choice for regular users',
    color: 'bg-green-500',
    features: [
      'All Basic features',
      'Voice command activation',
      'GPS-enabled documentation',
      'Priority support',
      'Evidence catalog'
    ],
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$19.99',
    period: 'month',
    description: 'Advanced features for power users',
    color: 'bg-purple-500',
    features: [
      'All Standard features',
      'Attorney network access',
      'Live streaming capability',
      'Advanced voice commands',
      'Multi-device sync'
    ],
    popular: false
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$29.99',
    period: 'month',
    description: 'Professional-grade protection',
    color: 'bg-orange-500',
    features: [
      'All Premium features',
      'Bluetooth hands-free operation',
      'AI-powered legal assistance',
      'Custom documentation templates',
      '24/7 priority support'
    ],
    popular: false
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$49.99',
    period: 'month',
    description: 'Complete protection ecosystem',
    color: 'bg-red-500',
    features: [
      'All Professional features',
      'Fleet management tools',
      'Custom integrations',
      'Dedicated account manager',
      'Advanced analytics',
      'White-label options'
    ],
    popular: false
  }
];

interface SubscriptionPlansProps {
  currentPlan?: string;
  onSelectPlan?: (planId: string) => void;
}

export function SubscriptionPlans({ currentPlan, onSelectPlan }: SubscriptionPlansProps) {
  
  const handlePlanSelect = (planId: string) => {
    // Emit plan selection event
    eventBus.emit({
      type: 'subscription.plan.selected',
      module: '@caren/subscription',
      payload: { planId, timestamp: Date.now() }
    });
    
    if (onSelectPlan) {
      onSelectPlan(planId);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Choose Your Protection Level</h2>
        <p className="text-gray-300 text-lg">
          Select the plan that best fits your legal protection needs
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subscriptionPlans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative bg-gray-900/50 border-gray-700 text-white transition-all duration-300 hover:scale-105 ${
              plan.popular ? 'ring-2 ring-cyan-400' : ''
            } ${currentPlan === plan.id ? 'ring-2 ring-green-400' : ''}`}
          >
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-cyan-400 text-black">
                <Star className="w-3 h-3 mr-1" />
                Most Popular
              </Badge>
            )}
            
            {currentPlan === plan.id && (
              <Badge className="absolute -top-2 right-4 bg-green-400 text-black">
                <CheckCircle className="w-3 h-3 mr-1" />
                Current Plan
              </Badge>
            )}

            <CardHeader className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full ${plan.color} flex items-center justify-center mb-4`}>
                {plan.id === 'free' && <Zap className="w-8 h-8 text-white" />}
                {plan.id === 'basic' && <Shield className="w-8 h-8 text-white" />}
                {['standard', 'premium', 'professional', 'enterprise'].includes(plan.id) && 
                  <Star className="w-8 h-8 text-white" />}
              </div>
              
              <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
              <CardDescription className="text-gray-400">
                {plan.description}
              </CardDescription>
              
              <div className="mt-4">
                <span className="text-3xl font-bold text-cyan-400">{plan.price}</span>
                {plan.period && (
                  <span className="text-gray-400 ml-1">/{plan.period}</span>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              {plan.limitations && (
                <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-600 rounded">
                  <p className="text-xs text-yellow-300 font-medium mb-2">Limitations:</p>
                  <ul className="space-y-1">
                    {plan.limitations.map((limitation, index) => (
                      <li key={index} className="text-xs text-yellow-300">
                        • {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>

            <CardFooter>
              <Button
                onClick={() => handlePlanSelect(plan.id)}
                className={`w-full ${
                  currentPlan === plan.id
                    ? 'bg-green-600 hover:bg-green-700'
                    : plan.popular
                    ? 'bg-cyan-600 hover:bg-cyan-700'
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
                disabled={currentPlan === plan.id}
              >
                {currentPlan === plan.id ? 'Current Plan' : 'Select Plan'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export { subscriptionPlans };