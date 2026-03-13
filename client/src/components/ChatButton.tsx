import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface ChatButtonProps {
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export default function ChatButton({ 
  onClick, 
  className = '', 
  size = 'sm',
  variant = 'outline'
}: ChatButtonProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default behavior: navigate to messages using client-side routing
      setLocation('/messages');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`flex items-center gap-2 ${className}`}
    >
      <MessageCircle className="w-4 h-4" />
      Chat
    </Button>
  );
}