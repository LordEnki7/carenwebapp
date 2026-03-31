import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckIcon, XIcon } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
}

interface PasswordCriteria {
  label: string;
  regex: RegExp;
  met: boolean;
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const criteria = useMemo((): PasswordCriteria[] => [
    {
      label: "At least 6 characters",
      regex: /.{6,}/,
      met: /.{6,}/.test(password),
    },
    {
      label: "Contains uppercase letter",
      regex: /[A-Z]/,
      met: /[A-Z]/.test(password),
    },
    {
      label: "Contains lowercase letter", 
      regex: /[a-z]/,
      met: /[a-z]/.test(password),
    },
    {
      label: "Contains number",
      regex: /\d/,
      met: /\d/.test(password),
    },
    {
      label: "Contains special character",
      regex: /[!@#$%^&*(),.?":{}|<>]/,
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
  ], [password]);

  const metCriteria = criteria.filter(c => c.met).length;
  const strengthPercentage = (metCriteria / criteria.length) * 100;

  const getStrengthLabel = () => {
    if (metCriteria === 0) return "";
    if (metCriteria <= 2) return "Weak";
    if (metCriteria <= 3) return "Fair";
    if (metCriteria <= 4) return "Good";
    return "Strong";
  };

  const getStrengthColor = () => {
    if (metCriteria <= 2) return "bg-red-500";
    if (metCriteria <= 3) return "bg-yellow-500";
    if (metCriteria <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Password Strength
          </span>
          <span className={`text-xs font-medium ${
            metCriteria <= 2 ? "text-red-600" :
            metCriteria <= 3 ? "text-yellow-600" :
            metCriteria <= 4 ? "text-blue-600" : "text-green-600"
          }`}>
            {getStrengthLabel()}
          </span>
        </div>
        <div className="relative">
          <Progress 
            value={strengthPercentage} 
            className="h-2"
          />
          <div 
            className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${strengthPercentage}%` }}
          />
        </div>
      </div>

      {/* Criteria List */}
      <div className="space-y-1">
        {criteria.map((criterion, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            {criterion.met ? (
              <CheckIcon className="h-3 w-3 text-green-600" />
            ) : (
              <XIcon className="h-3 w-3 text-gray-400" />
            )}
            <span className={`${
              criterion.met 
                ? "text-green-600 dark:text-green-400" 
                : "text-gray-500 dark:text-gray-400"
            }`}>
              {criterion.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}