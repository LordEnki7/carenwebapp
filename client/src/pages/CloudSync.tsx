import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  ArrowLeft, 
  Cloud, 
  Shield, 
  Plus, 
  RefreshCw, 
  HardDrive, 
  Clock, 
  Settings, 
  AlertTriangle, 
  CheckCircle,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import MobileResponsiveLayout from '@/components/MobileResponsiveLayout';

interface Device {
  id: string;
  deviceName: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  platform: 'ios' | 'android' | 'web' | 'windows' | 'mac';
  isActive: boolean;
  lastSyncAt: string;
  syncEnabled: boolean;
  autoSyncEnabled: boolean;
}

interface SyncConflict {
  id: string;
  dataType: string;
  entityId: string;
  conflictType: string;
  localVersion: number;
  remoteVersion: number;
  createdAt: string;
}

interface BackupSettings {
  isEnabled: boolean;
  autoBackupEnabled: boolean;
  backupFrequency: string;
  retentionDays: number;
  encryptionEnabled: boolean;
  compressionEnabled: boolean;
  includePriorityData: boolean;
  includePersonalData: boolean;
  includeMediaFiles: boolean;
  maxStorageGB: number;
  wifiOnlySync: boolean;
  lowPowerModeSync: boolean;
  notificationsEnabled: boolean;
  lastBackupAt?: string;
  nextScheduledBackup?: string;
}

interface StorageUsage {
  totalItems: number;
  storageUsedBytes: number;
  itemCount: number;
}

export default function CloudSync() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newDeviceDialogOpen, setNewDeviceDialogOpen] = useState(false);
  const [newDeviceData, setNewDeviceData] = useState({
    deviceName: '',
    deviceType: 'mobile' as 'mobile' | 'desktop' | 'tablet',
    platform: 'web' as 'ios' | 'android' | 'web' | 'windows' | 'mac'
  });

  // Fetch user devices
  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ['/api/cloud-sync/devices'],
    queryFn: async () => {
      const response = await fetch('/api/cloud-sync/devices', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch devices');
      const data = await response.json();
      return data.devices || [];
    }
  });

  const devices: Device[] = devicesData || [];

  // Fetch sync conflicts
  const { data: conflictsData, isLoading: conflictsLoading } = useQuery({
    queryKey: ['/api/cloud-sync/conflicts'],
    queryFn: async () => {
      const response = await fetch('/api/cloud-sync/conflicts', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch conflicts');
      const data = await response.json();
      return data.conflicts || [];
    }
  });

  const conflicts: SyncConflict[] = conflictsData || [];

  // Fetch backup settings
  const { data: backupSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/cloud-sync/backup-settings'],
    queryFn: async () => {
      const response = await fetch('/api/cloud-sync/backup-settings', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch backup settings');
      const data = await response.json();
      return data.settings;
    }
  });

  // Fetch storage usage
  const { data: storageUsageData, isLoading: storageLoading } = useQuery({
    queryKey: ['/api/cloud-sync/storage-usage'],
    queryFn: async () => {
      const response = await fetch('/api/cloud-sync/storage-usage', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch storage usage');
      const data = await response.json();
      return data.usage;
    }
  });

  const storageUsage: StorageUsage = storageUsageData || { totalItems: 0, storageUsedBytes: 0, itemCount: 0 };

  // Register device mutation
  const registerDeviceMutation = useMutation({
    mutationFn: async (deviceData: typeof newDeviceData) => {
      const response = await fetch('/api/cloud-sync/devices/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          ...deviceData,
          appVersion: '1.0.0'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to register device');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-sync/devices'] });
      setNewDeviceDialogOpen(false);
      setNewDeviceData({ deviceName: '', deviceType: 'mobile', platform: 'web' });
      toast({
        title: "Device Registered",
        description: "Your device has been successfully registered for cloud sync."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register device",
        variant: "destructive"
      });
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<BackupSettings>) => {
      const response = await fetch('/api/cloud-sync/backup-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-sync/backup-settings'] });
      toast({
        title: "Settings Updated",
        description: "Your backup settings have been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings",
        variant: "destructive"
      });
    }
  });

  // Full sync mutation
  const fullSyncMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await fetch('/api/cloud-sync/full-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          deviceId,
          localData: []
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Sync failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-sync/devices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-sync/storage-usage'] });
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${data.result?.syncedItems || 0} items.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync data",
        variant: "destructive"
      });
    }
  });

  // Resolve conflict mutation
  const resolveConflictMutation = useMutation({
    mutationFn: async ({ conflictId, resolution }: { conflictId: string; resolution: string }) => {
      const response = await fetch('/api/cloud-sync/conflicts/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ conflictId, resolution })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to resolve conflict');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-sync/conflicts'] });
      toast({
        title: "Conflict Resolved",
        description: "The data conflict has been successfully resolved."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Resolution Failed",
        description: error.message || "Failed to resolve conflict",
        variant: "destructive"
      });
    }
  });

  const handleAutoSyncToggle = (deviceId: string, enabled: boolean) => {
    toast({
      title: enabled ? "Auto-sync Enabled" : "Auto-sync Disabled",
      description: `Auto-sync has been ${enabled ? 'enabled' : 'disabled'} for this device.`
    });
  };

  const handleSettingUpdate = (key: string, value: any) => {
    if (backupSettings) {
      updateSettingsMutation.mutate({ [key]: value });
    }
  };

  const getDeviceIcon = (type: string, platform: string) => {
    if (type === 'mobile') return <Smartphone className="h-4 w-4" />;
    if (type === 'tablet') return <Tablet className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const getStoragePercentage = () => {
    if (!storageUsage || !backupSettings) return 0;
    const maxBytes = (backupSettings.maxStorageGB || 5) * 1024 * 1024 * 1024;
    return Math.min((storageUsage.storageUsedBytes / maxBytes) * 100, 100);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <MobileResponsiveLayout title="Secure Cloud Sync" description="Synchronize your data securely across all devices">
      <div className="min-h-screen bg-gray-900">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button size="sm" className="bg-gray-700 hover:bg-gray-600 text-white flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
                  <Cloud className="h-8 w-8 text-blue-400" />
                  Secure Cloud Sync
                </h1>
                <p className="text-gray-300">
                  Synchronize your data securely across all devices with end-to-end encryption
                </p>
              </div>
            </div>
            
            <Dialog open={newDeviceDialogOpen} onOpenChange={setNewDeviceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Device
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Register New Device</DialogTitle>
                  <DialogDescription>
                    Add a new device to your secure cloud sync network
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="deviceName">Device Name</Label>
                    <Input
                      id="deviceName"
                      value={newDeviceData.deviceName}
                      onChange={(e) => setNewDeviceData({...newDeviceData, deviceName: e.target.value})}
                      placeholder="My iPhone, Work Laptop, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="deviceType">Device Type</Label>
                    <Select 
                      value={newDeviceData.deviceType} 
                      onValueChange={(value: 'mobile' | 'desktop' | 'tablet') => 
                        setNewDeviceData({...newDeviceData, deviceType: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="tablet">Tablet</SelectItem>
                        <SelectItem value="desktop">Desktop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="platform">Platform</Label>
                    <Select 
                      value={newDeviceData.platform} 
                      onValueChange={(value: 'ios' | 'android' | 'web' | 'windows' | 'mac') => 
                        setNewDeviceData({...newDeviceData, platform: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ios">iOS</SelectItem>
                        <SelectItem value="android">Android</SelectItem>
                        <SelectItem value="web">Web</SelectItem>
                        <SelectItem value="windows">Windows</SelectItem>
                        <SelectItem value="mac">macOS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={() => registerDeviceMutation.mutate(newDeviceData)}
                    disabled={!newDeviceData.deviceName || registerDeviceMutation.isPending}
                  >
                    {registerDeviceMutation.isPending ? 'Registering...' : 'Register Device'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="devices" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-gray-800/50">
              <TabsTrigger value="devices" className="text-gray-300 data-[state=active]:text-white">My Devices</TabsTrigger>
              <TabsTrigger value="storage" className="text-gray-300 data-[state=active]:text-white">Storage & Usage</TabsTrigger>
              <TabsTrigger value="settings" className="text-gray-300 data-[state=active]:text-white">Sync Settings</TabsTrigger>
              <TabsTrigger value="conflicts" className="text-gray-300 data-[state=active]:text-white">Conflicts ({conflicts.length})</TabsTrigger>
            </TabsList>

            {/* Devices Tab */}
            <TabsContent value="devices" className="space-y-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Registered Devices
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Manage devices connected to your secure cloud sync network
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {devicesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    </div>
                  ) : devices.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      No devices registered yet. Add your first device to get started.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {devices.map((device: Device) => (
                        <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            {getDeviceIcon(device.deviceType, device.platform)}
                            <div>
                              <h3 className="font-medium">{device.deviceName}</h3>
                              <p className="text-sm text-gray-400 capitalize">
                                {device.platform} • {device.deviceType}
                              </p>
                              <p className="text-xs text-gray-400">
                                Last sync: {device.lastSyncAt ? new Date(device.lastSyncAt).toLocaleDateString() : 'Never'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <div className={`h-2 w-2 rounded-full ${device.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                              <span className="text-sm text-gray-400">
                                {device.isActive ? 'Online' : 'Offline'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch 
                                checked={device.autoSyncEnabled}
                                onCheckedChange={(checked) => handleAutoSyncToggle(device.id, checked)}
                              />
                              <Label className="text-sm">Auto-sync</Label>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => fullSyncMutation.mutate(device.id)}
                              disabled={fullSyncMutation.isPending}
                            >
                              {fullSyncMutation.isPending ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                'Sync Now'
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Storage Tab */}
            <TabsContent value="storage" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HardDrive className="h-5 w-5" />
                      Storage Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {storageLoading ? (
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-2 bg-gray-200 rounded"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span>Used: {formatBytes(storageUsage?.storageUsedBytes || 0)}</span>
                          <span>Limit: {backupSettings?.maxStorageGB || 5} GB</span>
                        </div>
                        <Progress value={getStoragePercentage()} className="h-2" />
                        <div className="text-xs text-gray-400">
                          {storageUsage?.itemCount || 0} items synced across all devices
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Sync Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Last successful sync:</span>
                        <span className="text-green-600">
                          {backupSettings?.lastBackupAt 
                            ? new Date(backupSettings.lastBackupAt).toLocaleDateString()
                            : 'Never'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Next scheduled sync:</span>
                        <span className="text-blue-600">
                          {backupSettings?.nextScheduledBackup
                            ? new Date(backupSettings.nextScheduledBackup).toLocaleDateString()
                            : 'Not scheduled'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sync frequency:</span>
                        <span className="capitalize">{backupSettings?.backupFrequency || 'Daily'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Backup & Sync Settings
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Configure how your data is synchronized and backed up
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {settingsLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-6 bg-gray-200 rounded w-10"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Enable Cloud Backup</Label>
                          <p className="text-sm text-gray-400">Automatically backup your data to secure cloud storage</p>
                        </div>
                        <Switch 
                          checked={backupSettings?.isEnabled}
                          onCheckedChange={(checked) => handleSettingUpdate('isEnabled', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto-Backup</Label>
                          <p className="text-sm text-gray-400">Automatically backup when changes are detected</p>
                        </div>
                        <Switch 
                          checked={backupSettings?.autoBackupEnabled}
                          onCheckedChange={(checked) => handleSettingUpdate('autoBackupEnabled', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>End-to-End Encryption</Label>
                          <p className="text-sm text-gray-400">Encrypt data with AES-256-GCM before upload</p>
                        </div>
                        <Switch 
                          checked={backupSettings?.encryptionEnabled}
                          onCheckedChange={(checked) => handleSettingUpdate('encryptionEnabled', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>WiFi-Only Sync</Label>
                          <p className="text-sm text-gray-400">Only sync when connected to WiFi</p>
                        </div>
                        <Switch 
                          checked={backupSettings?.wifiOnlySync}
                          onCheckedChange={(checked) => handleSettingUpdate('wifiOnlySync', checked)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Backup Frequency</Label>
                        <Select 
                          value={backupSettings?.backupFrequency || 'daily'}
                          onValueChange={(value) => handleSettingUpdate('backupFrequency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="realtime">Real-time</SelectItem>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Data Retention (Days)</Label>
                        <Select 
                          value={backupSettings?.retentionDays?.toString() || '90'}
                          onValueChange={(value) => handleSettingUpdate('retentionDays', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                            <SelectItem value="180">180 days</SelectItem>
                            <SelectItem value="365">1 year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Conflicts Tab */}
            <TabsContent value="conflicts" className="space-y-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Data Conflicts
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Resolve conflicts when the same data is modified on multiple devices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {conflictsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    </div>
                  ) : conflicts.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No Conflicts</h3>
                      <p className="text-gray-400">All your data is synchronized without conflicts</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {conflicts.map((conflict: SyncConflict) => (
                        <div key={conflict.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium capitalize">{conflict.dataType} Conflict</h3>
                              <p className="text-sm text-gray-400">
                                Conflict in {conflict.entityId} • {conflict.conflictType}
                              </p>
                            </div>
                            <Badge variant="destructive">Requires Resolution</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="border rounded p-3">
                              <h4 className="font-medium text-sm mb-2">Local Version (v{conflict.localVersion})</h4>
                              <p className="text-xs text-gray-300">Your device's version</p>
                            </div>
                            <div className="border rounded p-3">
                              <h4 className="font-medium text-sm mb-2">Remote Version (v{conflict.remoteVersion})</h4>
                              <p className="text-xs text-gray-300">Cloud version</p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => resolveConflictMutation.mutate({
                                conflictId: conflict.id,
                                resolution: 'local'
                              })}
                              disabled={resolveConflictMutation.isPending}
                            >
                              Keep Local
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => resolveConflictMutation.mutate({
                                conflictId: conflict.id,
                                resolution: 'remote'
                              })}
                              disabled={resolveConflictMutation.isPending}
                            >
                              Keep Remote
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MobileResponsiveLayout>
  );
};