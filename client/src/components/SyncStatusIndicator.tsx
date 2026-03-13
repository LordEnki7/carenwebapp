import { Wifi, WifiOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRealTimeSync } from "@/hooks/useRealTimeSync";

export default function SyncStatusIndicator() {
  const { isConnected, getConnectionStatus, requestSync } = useRealTimeSync();
  const status = getConnectionStatus();

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'bg-cyan-500';
      case 'connecting': return 'bg-purple-500';
      case 'disconnected': 
      case 'closed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Synced';
      case 'connecting': return 'Connecting';
      case 'disconnected': 
      case 'closed': return 'Offline';
      default: return 'Unknown';
    }
  };

  const getIcon = () => {
    if (status === 'connected') return <Wifi className="w-3 h-3" />;
    if (status === 'connecting') return <RotateCcw className="w-3 h-3 animate-spin" />;
    return <WifiOff className="w-3 h-3" />;
  };

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary" 
            className={`${getStatusColor()} text-white border-0 flex items-center gap-1`}
          >
            {getIcon()}
            {getStatusText()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Real-time sync status: {status}</p>
          <p className="text-xs text-muted-foreground">
            {isConnected() 
              ? "Your data is synchronized across devices" 
              : "Real-time sync is not available"
            }
          </p>
        </TooltipContent>
      </Tooltip>

      {status !== 'connected' && status !== 'connecting' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              onClick={requestSync}
              className="h-6 px-2"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Retry connection</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}