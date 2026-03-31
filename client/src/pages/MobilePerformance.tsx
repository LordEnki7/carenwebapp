import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useMobilePerformance } from '@/hooks/useMobilePerformance';
import { offlineStorage } from '@/services/OfflineStorageService';
import { FastEmergencyMode } from '@/components/FastEmergencyMode';
import { 
  Battery, 
  Wifi, 
  WifiOff, 
  Smartphone, 
  HardDrive, 
  Activity, 
  Zap,
  Shield,
  Download,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Signal
} from 'lucide-react';

export default function MobilePerformance() {
  const { toast } = useToast();
  const [storageUsage, setStorageUsage] = useState({ used: 0, quota: 0, percentage: 0 });
  const [offlineData, setOfflineData] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const {
    isOnline,
    isLowPowerMode,
    batteryLevel,
    networkType,
    memoryUsage,
    backgroundRecordingActive,
    emergencyModeActive,
    offlineCapabilities,
    enableLowPowerMode,
    disableLowPowerMode,
    optimizeForBattery,
    enableBackgroundRecording,
    disableBackgroundRecording,
    preloadEmergencyAssets,
    clearCache,
    enableEmergencyMode,
    disableEmergencyMode
  } = useMobilePerformance();

  // Update storage usage periodically
  useEffect(() => {
    const updateStorageUsage = async () => {
      const usage = await offlineStorage.getStorageUsage();
      setStorageUsage(usage);
    };

    updateStorageUsage();
    const interval = setInterval(updateStorageUsage, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Load offline data
  useEffect(() => {
    const loadOfflineData = async () => {
      const data = await offlineStorage.getAllUnsynced();
      setOfflineData(data);
    };

    loadOfflineData();
  }, []);

  const handleSyncData = async () => {
    setSyncStatus('syncing');
    try {
      const success = await offlineStorage.syncToServer();
      if (success) {
        setSyncStatus('success');
        toast({
          title: "Sync Complete",
          description: "All offline data synchronized successfully"
        });
        // Reload offline data
        const data = await offlineStorage.getAllUnsynced();
        setOfflineData(data);
      } else {
        setSyncStatus('error');
        toast({
          title: "Sync Failed",
          description: "Failed to sync offline data. Will retry automatically.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setSyncStatus('error');
      toast({
        title: "Sync Error",
        description: "An error occurred during synchronization",
        variant: "destructive"
      });
    }

    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const handleClearCache = async () => {
    try {
      await clearCache();
      await offlineStorage.clearOldData(7);
      
      // Update storage usage
      const usage = await offlineStorage.getStorageUsage();
      setStorageUsage(usage);
      
      toast({
        title: "Cache Cleared",
        description: "All cached data removed successfully"
      });
    } catch (error) {
      toast({
        title: "Clear Cache Failed",
        description: "Failed to clear cache data",
        variant: "destructive"
      });
    }
  };

  const handlePreloadAssets = async () => {
    try {
      await preloadEmergencyAssets();
      await offlineStorage.preloadEmergencyData();
      
      toast({
        title: "Assets Preloaded",
        description: "Emergency data cached for offline use"
      });
    } catch (error) {
      toast({
        title: "Preload Failed",
        description: "Failed to preload emergency assets",
        variant: "destructive"
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-500';
    if (level > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getNetworkIcon = () => {
    if (!isOnline) return <WifiOff className="w-5 h-5 text-red-500" />;
    return <Wifi className="w-5 h-5 text-green-500" />;
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Smartphone className="w-8 h-8" />
            Mobile Performance Center
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Monitor and optimize mobile performance for emergency situations
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="emergency">Emergency Mode</TabsTrigger>
          <TabsTrigger value="offline">Offline Data</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* System Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Network Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {getNetworkIcon()}
                  Network
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Status</span>
                    <Badge variant={isOnline ? 'default' : 'destructive'}>
                      {isOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Type</span>
                    <span className="text-sm font-mono capitalize">{networkType}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Battery Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Battery className={`w-5 h-5 ${getBatteryColor(batteryLevel)}`} />
                  Battery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Level</span>
                    <span className={`text-sm font-bold ${getBatteryColor(batteryLevel)}`}>
                      {batteryLevel}%
                    </span>
                  </div>
                  <Progress value={batteryLevel} className="h-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Power Mode</span>
                    <Badge variant={isLowPowerMode ? 'destructive' : 'default'}>
                      {isLowPowerMode ? 'Low Power' : 'Normal'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5" />
                  Memory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Usage</span>
                    <span className="text-sm font-bold">{memoryUsage}%</span>
                  </div>
                  <Progress value={memoryUsage} className="h-2" />
                  <div className="text-xs text-gray-500">
                    JavaScript heap usage
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Storage Usage */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HardDrive className="w-5 h-5" />
                  Storage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Used</span>
                    <span className="text-sm font-bold">{formatBytes(storageUsage.used)}</span>
                  </div>
                  <Progress value={storageUsage.percentage} className="h-2" />
                  <div className="text-xs text-gray-500">
                    {storageUsage.percentage}% of {formatBytes(storageUsage.quota)} quota
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Offline Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Offline Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(offlineCapabilities).map(([key, available]) => (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      available 
                        ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {available ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                    </div>
                    <Badge variant={available ? 'default' : 'secondary'}>
                      {available ? 'Ready' : 'Limited'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Emergency Mode</span>
                  <Badge variant={emergencyModeActive ? 'destructive' : 'secondary'}>
                    {emergencyModeActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Background Recording</span>
                  <Badge variant={backgroundRecordingActive ? 'default' : 'secondary'}>
                    {backgroundRecordingActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Low Power Mode</span>
                  <Badge variant={isLowPowerMode ? 'destructive' : 'secondary'}>
                    {isLowPowerMode ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handlePreloadAssets}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Preload Emergency Data
                </Button>
                <Button
                  onClick={isLowPowerMode ? disableLowPowerMode : enableLowPowerMode}
                  className="w-full"
                  variant="outline"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {isLowPowerMode ? 'Disable' : 'Enable'} Low Power Mode
                </Button>
                <Button
                  onClick={handleClearCache}
                  className="w-full"
                  variant="outline"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Cache
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Emergency Mode Tab */}
        <TabsContent value="emergency" className="space-y-4">
          <FastEmergencyMode />
        </TabsContent>

        {/* Offline Data Tab */}
        <TabsContent value="offline" className="space-y-4">
          {/* Sync Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Offline Data Management</span>
                <Button
                  onClick={handleSyncData}
                  disabled={!isOnline || syncStatus === 'syncing'}
                  variant="outline"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  {syncStatus === 'syncing' ? 'Syncing...' : 'Sync to Server'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Sync Status Display */}
                <div className="flex items-center gap-2">
                  <Signal className="w-5 h-5" />
                  <span>Sync Status:</span>
                  <Badge
                    variant={
                      syncStatus === 'success' ? 'default' :
                      syncStatus === 'error' ? 'destructive' :
                      syncStatus === 'syncing' ? 'secondary' : 'outline'
                    }
                  >
                    {syncStatus === 'syncing' ? 'Syncing...' :
                     syncStatus === 'success' ? 'Success' :
                     syncStatus === 'error' ? 'Failed' : 'Idle'}
                  </Badge>
                </div>

                {/* Offline Data List */}
                <div>
                  <h4 className="font-medium mb-2">Unsynced Data ({offlineData.length} items)</h4>
                  {offlineData.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                      <p>All data is synchronized</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {offlineData.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div>
                            <div className="font-medium capitalize">
                              {item.type || 'Unknown Type'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(item.timestamp || Date.now()).toLocaleString()}
                            </div>
                          </div>
                          <Badge variant={item.emergency ? 'destructive' : 'secondary'}>
                            {item.emergency ? 'Emergency' : 'Normal'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Battery Optimization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Battery className="w-5 h-5" />
                  Battery Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button
                    onClick={optimizeForBattery}
                    className="w-full"
                    variant="outline"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Optimize for Battery Life
                  </Button>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <h4 className="font-medium mb-2">Battery-saving features:</h4>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Reduce recording quality</li>
                      <li>Lower animation frame rate</li>
                      <li>Disable non-essential background tasks</li>
                      <li>Optimize screen brightness</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Performance Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button
                    onClick={backgroundRecordingActive ? disableBackgroundRecording : enableBackgroundRecording}
                    className="w-full"
                    variant="outline"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {backgroundRecordingActive ? 'Disable' : 'Enable'} Background Recording
                  </Button>
                  
                  <Button
                    onClick={emergencyModeActive ? disableEmergencyMode : enableEmergencyMode}
                    className="w-full"
                    variant={emergencyModeActive ? "destructive" : "default"}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {emergencyModeActive ? 'Disable' : 'Enable'} Emergency Mode
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 text-green-600">✓ Recommended</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Keep app in foreground during emergencies</li>
                    <li>• Preload emergency data before travel</li>
                    <li>• Enable background recording for safety</li>
                    <li>• Keep device charged above 20%</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-red-600">⚠ Avoid</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Running multiple recording apps</li>
                    <li>• Clearing app cache during emergencies</li>
                    <li>• Disabling location services</li>
                    <li>• Using maximum recording quality on low battery</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}