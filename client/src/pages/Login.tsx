import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, FileText, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

export default function Login() {
  const [agreements, setAgreements] = useState({
    disclaimer: false,
    userAgreement: false,
  });
  const { toast } = useToast();

  const allAgreed = Object.values(agreements).every(agreed => agreed);

  const handleAgreementChange = (key: keyof typeof agreements, checked: boolean) => {
    setAgreements(prev => ({ ...prev, [key]: checked }));
  };

  const acceptTermsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/accept-terms"),
    onSuccess: () => {
      // Invalidate user cache to refresh authentication state
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Welcome to C.A.R.E.N.™",
        description: "Terms accepted successfully. Loading your dashboard...",
      });
      
      // For demo: directly access dashboard after terms acceptance
      // In production, this would redirect to OAuth provider
      setTimeout(() => {
        window.location.reload(); // Reload to trigger authentication check
      }, 1000);
    },
    onError: (error) => {
      console.error("Terms acceptance error:", error);
      toast({
        title: "Error",
        description: "Failed to record terms acceptance. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!allAgreed) return;
    
    // Record terms acceptance then redirect to login
    acceptTermsMutation.mutate();
  };

  const PolicyDialog = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Icon className="w-4 h-4 mr-1" />
          Read
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-4">
          {children}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to C.A.R.E.N.™</CardTitle>
          <CardDescription>
            Citizen Assistance for Roadside Emergencies and Navigation
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center text-sm text-muted-foreground">
            Before accessing the platform, please review and accept our essential terms and policies.
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="disclaimer"
                checked={agreements.disclaimer}
                onCheckedChange={(checked) => handleAgreementChange('disclaimer', checked as boolean)}
              />
              <div className="flex-1 flex items-center justify-between">
                <label htmlFor="disclaimer" className="text-sm font-medium cursor-pointer">
                  Legal Disclaimer
                </label>
                <PolicyDialog title="Legal Disclaimer" icon={AlertTriangle}>
                  <div className="prose dark:prose-invert max-w-none">
                    <h3>Important Legal Notice</h3>
                    <p className="text-red-600 dark:text-red-400 font-semibold">
                      C.A.R.E.N.™ provides informational resources only and does not constitute legal advice.
                    </p>
                    <ul>
                      <li>Information may not be current or complete</li>
                      <li>Laws vary by jurisdiction and change frequently</li>
                      <li>Always consult qualified legal counsel for specific situations</li>
                      <li>Use at your own risk and discretion</li>
                      <li>No attorney-client relationship is created</li>
                    </ul>
                  </div>
                </PolicyDialog>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="userAgreement"
                checked={agreements.userAgreement}
                onCheckedChange={(checked) => handleAgreementChange('userAgreement', checked as boolean)}
              />
              <div className="flex-1 flex items-center justify-between">
                <label htmlFor="userAgreement" className="text-sm font-medium cursor-pointer">
                  User Agreement
                </label>
                <PolicyDialog title="User Agreement" icon={FileText}>
                  <div className="prose dark:prose-invert max-w-none">
                    <h3>C.A.R.E.N.™ User Agreement</h3>
                    <p>By using C.A.R.E.N.™, you agree to:</p>
                    <ul>
                      <li>Use the platform responsibly and lawfully</li>
                      <li>Provide accurate information when creating incidents</li>
                      <li>Respect the rights and safety of others</li>
                      <li>Comply with all applicable laws and regulations</li>
                      <li>Not misuse emergency features or contact systems</li>
                    </ul>
                    <p>This agreement governs your access to and use of the C.A.R.E.N.™ platform and all its features.</p>
                  </div>
                </PolicyDialog>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-2">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Additional Terms Automatically Accepted</p>
                <p>By accepting the above agreements, you also automatically agree to our Privacy Policy, End User License Agreement (EULA), Payment Terms, Cookie Policy, Rights You Grant Us, Support Community Terms, and Entire Agreement.</p>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            All supporting legal documents are available in your account settings after sign-in.
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={!allAgreed || acceptTermsMutation.isPending}
            className="w-full"
            size="lg"
          >
            {acceptTermsMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              "Accept Terms & Sign In"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}