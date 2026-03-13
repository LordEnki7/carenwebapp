import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { LANGUAGES, type Language } from "@/types";
import { setLanguage, getCurrentLanguage } from "@/lib/i18n";
import { useTranslation } from "@/hooks/useTranslation";
import VoiceCommandButton from "@/components/VoiceCommandButton";
import SyncStatusIndicator from "@/components/SyncStatusIndicator";

interface TopBarProps {
  title: string;
  description: string;
  onEmergencyRecord?: () => void;
}

export default function TopBar({ title, description, onEmergencyRecord }: TopBarProps) {
  const { t } = useTranslation();
  
  const handleLanguageChange = (languageCode: string) => {
    setLanguage(languageCode);
  };

  return (
    <header className="bg-gray-800/50 border-b border-gray-700 px-6 py-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
          <p className="text-sm text-gray-700 dark:text-gray-400 mt-1">{description}</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Real-time Sync Status */}
          <SyncStatusIndicator />
          
          {/* Language Selector */}
          <Select value={getCurrentLanguage()} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-40 bg-gray-800/50 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {LANGUAGES.map((language: Language) => (
                <SelectItem key={language.code} value={language.code} className="text-white hover:bg-gray-700">
                  {language.flag} {language.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Voice Commands */}
          <VoiceCommandButton 
            className="mr-2"
          />
          
          {/* Emergency Alert Button */}
          {onEmergencyRecord && (
            <Button 
              onClick={onEmergencyRecord}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {t("emergencyRecord")}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
