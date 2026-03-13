import { Button } from "@/components/ui/button";
import { Scale } from "lucide-react";

export default function FloatingAttorneyButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button 
        size="lg"
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg rounded-full px-6 py-3 transform transition-all duration-200 hover:scale-105"
        onClick={() => window.location.href = '/attorney-signup'}
      >
        <Scale className="h-5 w-5 mr-2" />
        Join Attorney Network
      </Button>
    </div>
  );
}