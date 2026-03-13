import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import carenLogo from "@assets/caren_webapp_logo_1750345968202.png";
import MobileResponsiveLayout from "@/components/MobileResponsiveLayout";

export default function SimpleSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/demo-login", {});
      
      if (response.success) {
        // Store authentication data
        if (response.demoSessionKey) {
          localStorage.setItem('demoSessionKey', response.demoSessionKey);
        }
        if (response.customDomainToken) {
          localStorage.setItem('customDomainToken', response.customDomainToken);
        }
        
        toast({
          title: "Demo Login Successful",
          description: "Welcome to CAREN!",
        });
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Demo login error:', error);
      toast({
        title: "Login Failed",
        description: "Please try again or check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileResponsiveLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800">
        <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <img 
            src={carenLogo} 
            alt="CAREN Logo" 
            className="mx-auto h-16 w-auto mb-4"
          />
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">CAREN</h1>
          <p className="text-gray-300 text-lg">Constitutional Rights & Emergency Network</p>
          <p className="text-gray-400 text-sm mt-2">Legal protection platform with emergency voice commands</p>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-cyan-400 mb-4">Quick Demo Access</h2>
            <p className="text-gray-300 text-sm mb-4">
              Experience CAREN's emergency voice commands and legal rights platform
            </p>
            
            <button
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 
                         text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Connecting...
                </div>
              ) : (
                "🚀 Start Demo"
              )}
            </button>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">Emergency Commands: "emergency" • "help me" • "police"</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-sm">
              GPS-aware legal rights • Incident recording • Emergency alerts
            </p>
          </div>
        </div>
      </div>
    </MobileResponsiveLayout>
  );
}