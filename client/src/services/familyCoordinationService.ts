import { toast } from "@/hooks/use-toast";

interface FamilyEmergencyAlert {
  type: 'family_emergency' | 'teen_emergency' | 'location_update';
  message: string;
  location?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  relationship: string;
  role: 'admin' | 'member' | 'child';
  status: 'active' | 'pending' | 'inactive';
  emergencyContact: boolean;
}

class FamilyCoordinationService {
  private static instance: FamilyCoordinationService;
  
  private constructor() {
    this.setupEventListeners();
  }

  public static getInstance(): FamilyCoordinationService {
    if (!FamilyCoordinationService.instance) {
      FamilyCoordinationService.instance = new FamilyCoordinationService();
    }
    return FamilyCoordinationService.instance;
  }

  private setupEventListeners(): void {
    // Family Emergency Alert Handler
    window.addEventListener('triggerFamilyEmergency', ((event: CustomEvent<FamilyEmergencyAlert>) => {
      this.handleFamilyEmergency(event.detail);
    }) as EventListener);

    // Teen Emergency Handler
    window.addEventListener('triggerTeenEmergency', ((event: CustomEvent<FamilyEmergencyAlert>) => {
      this.handleTeenEmergency(event.detail);
    }) as EventListener);

    // Family Location Sharing Handler
    window.addEventListener('shareFamilyLocation', ((event: CustomEvent) => {
      this.handleLocationSharing(event.detail);
    }) as EventListener);

    // Family Status Check Handler
    window.addEventListener('checkFamilyStatus', (() => {
      this.handleFamilyStatusCheck();
    }) as EventListener);

    // Family Recording Handler
    window.addEventListener('startFamilyRecording', (() => {
      this.handleFamilyRecording();
    }) as EventListener);
  }

  private async handleFamilyEmergency(alertData: FamilyEmergencyAlert): Promise<void> {
    try {
      // Get current location if not provided
      const location = alertData.location || await this.getCurrentLocation();
      
      // Send family emergency alert
      const response = await fetch('/api/family/emergency-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: alertData.type,
          message: alertData.message,
          location: location,
          priority: alertData.priority,
          timestamp: new Date().toISOString(),
          source: 'voice_command'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "Family Emergency Alert Sent",
          description: `${result.familyMembersNotified || 0} family members notified`,
          variant: "destructive"
        });

        // Log family emergency activity
        this.logFamilyActivity({
          type: 'emergency',
          description: `Emergency alert sent to ${result.familyMembersNotified || 0} family members`,
          urgent: true,
          timestamp: new Date()
        });
      } else {
        throw new Error('Failed to send family emergency alert');
      }
    } catch (error) {
      console.error('Family emergency alert error:', error);
      toast({
        title: "Family Alert Error",
        description: "Failed to notify family members. Please try again.",
        variant: "destructive"
      });
    }
  }

  private async handleTeenEmergency(alertData: FamilyEmergencyAlert): Promise<void> {
    try {
      const location = alertData.location || await this.getCurrentLocation();
      
      // Send teen-specific emergency alert with parent priority
      const response = await fetch('/api/family/teen-emergency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'teen_emergency',
          message: alertData.message,
          location: location,
          priority: 'high',
          timestamp: new Date().toISOString(),
          source: 'teen_voice_command',
          parentNotificationRequired: true
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "Teen Emergency - Parents Notified",
          description: `Parents and ${result.familyMembersNotified || 0} family members alerted`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Teen emergency alert error:', error);
      toast({
        title: "Teen Emergency Alert Error",
        description: "Failed to notify parents. Please try emergency contacts.",
        variant: "destructive"
      });
    }
  }

  private async handleLocationSharing(locationData: any): Promise<void> {
    try {
      const response = await fetch('/api/family/share-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: locationData.location,
          message: locationData.message,
          timestamp: new Date().toISOString(),
          source: 'voice_command'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "Location Shared",
          description: `Location sent to ${result.familyMembersNotified || 0} family members`
        });

        this.logFamilyActivity({
          type: 'location',
          description: 'Location shared with family via voice command',
          urgent: false,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Location sharing error:', error);
      toast({
        title: "Location Sharing Error",
        description: "Failed to share location with family",
        variant: "destructive"
      });
    }
  }

  private async handleFamilyStatusCheck(): Promise<void> {
    try {
      const response = await fetch('/api/family/status-check', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const familyStatus = await response.json();
        
        // Provide voice feedback about family status
        const activeMembers = familyStatus.members?.filter((m: FamilyMember) => m.status === 'active').length || 0;
        const safeMembers = familyStatus.safeMembers || 0;
        
        const statusMessage = `Family status check complete. ${activeMembers} family members, ${safeMembers} confirmed safe.`;
        
        // Use speech synthesis for voice feedback
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(statusMessage);
          utterance.rate = 1.2;
          utterance.volume = 0.8;
          speechSynthesis.speak(utterance);
        }

        toast({
          title: "Family Status Check",
          description: statusMessage
        });
      }
    } catch (error) {
      console.error('Family status check error:', error);
      toast({
        title: "Status Check Error",
        description: "Unable to check family status",
        variant: "destructive"
      });
    }
  }

  private async handleFamilyRecording(): Promise<void> {
    try {
      // Notify family members about the recording start
      const response = await fetch('/api/family/recording-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'recording_started',
          message: 'Family member started emergency recording',
          timestamp: new Date().toISOString(),
          source: 'voice_command'
        }),
      });

      if (response.ok) {
        toast({
          title: "Family Recording Started",
          description: "Family members notified of emergency recording"
        });

        this.logFamilyActivity({
          type: 'incident',
          description: 'Emergency recording started with family coordination',
          urgent: true,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Family recording notification error:', error);
    }
  }

  private async getCurrentLocation(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          resolve(null);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  }

  private async logFamilyActivity(activity: {
    type: 'emergency' | 'incident' | 'location' | 'message';
    description: string;
    urgent: boolean;
    timestamp: Date;
  }): Promise<void> {
    try {
      await fetch('/api/family/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...activity,
          source: 'voice_command'
        }),
      });
    } catch (error) {
      console.warn('Failed to log family activity:', error);
    }
  }

  public async getFamilyMembers(): Promise<FamilyMember[]> {
    try {
      const response = await fetch('/api/family/members');
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Failed to get family members:', error);
      return [];
    }
  }

  public async addFamilyMember(memberData: Partial<FamilyMember>): Promise<boolean> {
    try {
      const response = await fetch('/api/family/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to add family member:', error);
      return false;
    }
  }
}

// Initialize the service
const familyCoordinationService = FamilyCoordinationService.getInstance();

export default familyCoordinationService;
export { FamilyCoordinationService };