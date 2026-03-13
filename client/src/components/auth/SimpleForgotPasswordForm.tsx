import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface SimpleForgotPasswordFormProps {
  onSwitchToSignIn: () => void;
}

export default function SimpleForgotPasswordForm({ onSwitchToSignIn }: SimpleForgotPasswordFormProps) {
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormData) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your email for password reset instructions.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Reset Email",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPasswordMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Reset Your Password</h2>
        <p className="text-gray-300">Enter your email to receive reset instructions</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="forgot-email" className="text-gray-200 font-medium">Email Address</Label>
          <Input
            id="forgot-email"
            type="email"
            placeholder="Enter your email address"
            {...form.register("email")}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
          />
          {form.formState.errors.email && (
            <p className="text-xs text-red-400 mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
          disabled={forgotPasswordMutation.isPending}
        >
          {forgotPasswordMutation.isPending ? "Sending Reset Email..." : "Send Password Reset Email"}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-300">
          Remember your password?{" "}
          <button 
            onClick={onSwitchToSignIn}
            className="text-cyan-400 hover:text-cyan-300 underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}