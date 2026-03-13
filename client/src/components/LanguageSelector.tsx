import { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Supported languages for CAREN platform
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

interface LanguageSelectorProps {
  currentLanguage?: string;
  compact?: boolean;
  showLabel?: boolean;
}

export function LanguageSelector({ 
  currentLanguage = 'en', 
  compact = false, 
  showLabel = true 
}: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('caren-language') || currentLanguage || 'en';
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update language preference in database
  const updateLanguageMutation = useMutation({
    mutationFn: async (languageCode: string) => {
      const response = await apiRequest("PATCH", "/api/user/language", {
        preferredLanguage: languageCode
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update language preference");
      }
      return response.json();
    },
    onSuccess: (data, languageCode) => {
      // Update local storage
      localStorage.setItem('caren-language', languageCode);
      
      // Invalidate user queries to refresh with new language
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      const selectedLang = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
      toast({
        title: "Language Updated",
        description: `Your preferred language has been set to ${selectedLang?.name || languageCode}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
      // Revert selection on error
      setSelectedLanguage(currentLanguage);
    },
  });

  // Update when currentLanguage prop changes
  useEffect(() => {
    if (currentLanguage && currentLanguage !== selectedLanguage) {
      setSelectedLanguage(currentLanguage);
    }
  }, [currentLanguage, selectedLanguage]);

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    updateLanguageMutation.mutate(languageCode);
  };

  const selectedLangData = SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage);

  if (compact) {
    return (
      <Select 
        value={selectedLanguage} 
        onValueChange={handleLanguageChange}
        disabled={updateLanguageMutation.isPending}
      >
        <SelectTrigger className="w-fit border-none bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800">
          <div className="flex items-center space-x-1">
            <span className="text-lg">{selectedLangData?.flag}</span>
            <span className="text-sm">{selectedLangData?.code.toUpperCase()}</span>
          </div>
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-600">
          {SUPPORTED_LANGUAGES.map((language) => (
            <SelectItem key={language.code} value={language.code} className="text-white hover:bg-gray-700">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{language.flag}</span>
                <span>{language.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Language / Idioma / Langue
        </label>
      )}
      <Select 
        value={selectedLanguage} 
        onValueChange={handleLanguageChange}
        disabled={updateLanguageMutation.isPending}
      >
        <SelectTrigger className="w-full bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700">
          <SelectValue>
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span className="text-lg">{selectedLangData?.flag}</span>
              <span>{selectedLangData?.name}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-600">
          {SUPPORTED_LANGUAGES.map((language) => (
            <SelectItem key={language.code} value={language.code} className="text-white hover:bg-gray-700">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{language.flag}</span>
                <span>{language.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {updateLanguageMutation.isPending && (
        <p className="text-xs text-gray-500">Updating language preference...</p>
      )}
    </div>
  );
}