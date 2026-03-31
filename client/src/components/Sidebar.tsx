import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth, performLogout } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import {
  Car,
  Home,
  MessageCircle,
  Scale,
  Settings,
  Shield,
  UserCheck,
  VideoIcon,
  HelpCircle,
  LogOut,
  Cloud,
  Brain,
  AlertTriangle,
  Zap,
  Map,
  Wrench,
  FileText,
  VolumeX,
  Monitor,
  Sliders,
  MessageSquarePlus,
  ClipboardList,
  ChevronDown,
  Lock,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import carenLogo from "@assets/caren-logo.png";
import { isFeatureLocked, getRequiredPlan } from "@/lib/featureAccess";
import UpgradeSheet from "@/components/UpgradeSheet";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  priority?: string;
  description?: string;
}

interface NavGroup {
  id: string;
  label: string;
  icon: any;
  color: string;
  activeColor: string;
  headerColor: string;
  items: NavItem[];
  isEmergency?: boolean;
}

const navGroups: NavGroup[] = [
  {
    id: "emergency",
    label: "Emergency",
    icon: AlertTriangle,
    color: "text-red-400",
    activeColor: "text-red-300",
    headerColor: "text-red-300",
    isEmergency: true,
    items: [
      { name: "Emergency Pullover", href: "/emergency-pullover", icon: Car, priority: "critical", description: "Traffic Stop" },
      { name: "De-Escalation Guide", href: "/de-escalation-guide", icon: Shield, priority: "critical", description: "Safety Strategies" },
      { name: "Emergency Sharing", href: "/emergency-sharing", icon: Zap, priority: "critical", description: "Share Location" },
      { name: "Record Incident", href: "/record", icon: VideoIcon, priority: "high", description: "Document Evidence" },
      { name: "Police Monitor", href: "/police-monitor", icon: Shield, priority: "high", description: "Monitor Rights" },
      { name: "Smart Auto-Mute", href: "/smart-auto-mute", icon: VolumeX, priority: "high", description: "Intelligent Recording Protection" },
    ],
  },
  {
    id: "main",
    label: "Main",
    icon: Home,
    color: "text-cyan-400",
    activeColor: "text-cyan-300",
    headerColor: "text-cyan-300",
    items: [
      { name: "Dashboard", href: "/", icon: Home },
      { name: "Legal Rights", href: "/legal-rights-map", icon: Map, description: "Interactive Rights Map" },
      { name: "Complaints", href: "/file-complaint", icon: FileText, description: "File & Track Complaints" },
      { name: "Attorneys", href: "/attorneys", icon: UserCheck },
      { name: "Messages", href: "/messages", icon: MessageCircle },
      { name: "Roadside Assistance", href: "/roadside-assistance", icon: Wrench },
    ],
  },
  {
    id: "advanced",
    label: "Advanced",
    icon: Brain,
    color: "text-purple-400",
    activeColor: "text-purple-300",
    headerColor: "text-purple-300",
    items: [
      { name: "Voice Authentication", href: "/voice-auth", icon: Shield, description: "Voice Print Login" },
      { name: "Vehicle Readability", href: "/vehicle-readability", icon: Monitor, description: "Vehicle Screen Optimization" },
      { name: "Cloud Sync", href: "/cloud-sync", icon: Cloud },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    icon: Sliders,
    color: "text-amber-400",
    activeColor: "text-amber-300",
    headerColor: "text-amber-300",
    items: [
      { name: "Feature Picker", href: "/feature-picker", icon: Sliders, description: "Customize Your Features" },
      { name: "Feedback", href: "/feedback", icon: MessageSquarePlus, description: "Request Features & Vote" },
      { name: "Waitlist", href: "/waitlist", icon: ClipboardList, description: "Join the Launch List" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    color: "text-green-400",
    activeColor: "text-green-300",
    headerColor: "text-green-300",
    items: [
      { name: "Settings", href: "/settings", icon: Settings, description: "Account & Pricing" },
      { name: "Account Security", href: "/account-security", icon: Shield, description: "Session & Security Management" },
      { name: "Help", href: "/help", icon: HelpCircle },
    ],
  },
];

interface LockedFeature {
  name: string;
  href: string;
}

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const userTier = (user as any)?.subscriptionTier;

  const getActiveGroupId = () => {
    for (const group of navGroups) {
      if (group.items.some(item => item.href === location)) return group.id;
    }
    return "main";
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Layer 1: Emergency + Main open by default; only the active group also opens on navigate
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const activeGroup = (() => {
      for (const group of navGroups) {
        if (group.items.some(item => item.href === location)) return group.id;
      }
      return "main";
    })();
    return { emergency: true, main: true, [activeGroup]: true };
  });

  useEffect(() => {
    const activeId = getActiveGroupId();
    setOpenGroups(prev => {
      if (prev[activeId]) return prev;
      return { ...prev, [activeId]: true };
    });
  }, [location]);

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Layer 2 & 3: Locked feature upgrade sheet
  const [lockedFeature, setLockedFeature] = useState<LockedFeature | null>(null);

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const handleLogout = async () => {
    try {
      const { performLogout } = await import('@/hooks/useAuth');
      await performLogout();
    } catch (error) {
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }
  };

  const groupHasActiveItem = (group: NavGroup) => {
    return group.items.some(item => item.href === location);
  };

  const renderNavItem = (item: NavItem, group: NavGroup) => {
    const Icon = item.icon;
    const isActive = location === item.href;
    const isEmergency = group.isEmergency;
    const locked = isFeatureLocked(userTier, item.href);

    const baseClasses = cn(
      "group flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200",
      locked
        ? "opacity-50 text-gray-500 hover:opacity-70 hover:bg-white/5 border border-transparent"
        : isEmergency && item.priority === "critical"
        ? isActive
          ? "bg-red-500/20 border border-red-400/50 text-red-300"
          : "hover:bg-red-500/10 border border-transparent text-red-400/80 hover:text-red-300"
        : isEmergency && item.priority === "high"
        ? isActive
          ? "bg-orange-500/20 border border-orange-400/50 text-orange-300"
          : "hover:bg-orange-500/10 border border-transparent text-orange-400/80 hover:text-orange-300"
        : isActive
          ? "bg-cyan-500/20 border border-cyan-400/50 text-cyan-300"
          : "hover:bg-cyan-500/10 border border-transparent text-gray-300 hover:text-cyan-300"
    );

    const iconClasses = cn(
      "w-4 h-4 mr-3 flex-shrink-0 transition-colors",
      locked
        ? "text-gray-600"
        : isEmergency && item.priority === "critical"
        ? isActive ? "text-red-400" : "text-red-500/70"
        : isEmergency && item.priority === "high"
        ? isActive ? "text-orange-400" : "text-orange-500/70"
        : isActive ? "text-cyan-400" : "text-gray-400"
    );

    const inner = (
      <div className={baseClasses}>
        <Icon className={iconClasses} />
        <span className="truncate flex-1">{t(item.name)}</span>
        {locked ? (
          <Lock className="w-3 h-3 text-gray-600 ml-auto flex-shrink-0" />
        ) : isEmergency && item.priority === "critical" ? (
          <Zap className="w-3.5 h-3.5 text-red-400 ml-auto flex-shrink-0" />
        ) : null}
      </div>
    );

    if (locked) {
      return (
        <div
          key={item.name}
          onClick={() => setLockedFeature({ name: item.name, href: item.href })}
        >
          {inner}
        </div>
      );
    }

    return (
      <Link key={item.name} href={item.href}>
        {inner}
      </Link>
    );
  };

  const lockedPlan = lockedFeature ? getRequiredPlan(lockedFeature.href) : null;

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-72 cyber-sidebar flex flex-col">
      <div className="flex items-center h-16 px-6 border-b border-cyan-500/20 flex-shrink-0 bg-gradient-to-r from-slate-900/90 to-slate-800/90">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={carenLogo}
              alt="C.A.R.E.N.™ Logo"
              className="w-10 h-10 rounded-lg shadow-sm"
            />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h1 className="text-lg font-bold cyber-text tracking-tight">C.A.R.E.N.™</h1>
            <p className="text-xs text-cyan-300 font-medium">Pro-Tecktion</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navGroups.map((group, idx) => {
          const GroupIcon = group.icon;
          const isOpen = !!openGroups[group.id];
          const hasActive = groupHasActiveItem(group);

          return (
            <div key={group.id}>
              {idx === 3 && <div className="border-t border-cyan-500/20 my-2" />}
              <button
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  "w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all duration-200 group",
                  hasActive
                    ? `${group.headerColor} bg-white/5`
                    : `text-gray-400 hover:text-gray-200 hover:bg-white/5`
                )}
              >
                <GroupIcon className={cn("w-4 h-4 mr-2.5 flex-shrink-0", group.color)} />
                <span className="text-xs flex-1 text-left">{group.label}</span>
                {hasActive && (
                  <span className={cn("w-1.5 h-1.5 rounded-full mr-2",
                    group.id === 'emergency' ? 'bg-red-400' :
                    group.id === 'advanced' ? 'bg-purple-400' :
                    group.id === 'platform' ? 'bg-amber-400' :
                    group.id === 'settings' ? 'bg-green-400' : 'bg-cyan-400'
                  )} />
                )}
                <ChevronDown className={cn(
                  "w-4 h-4 flex-shrink-0 transition-transform duration-200",
                  isOpen ? "rotate-0" : "-rotate-90"
                )} />
              </button>
              <div className={cn(
                "overflow-hidden transition-all duration-200",
                isOpen ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
              )}>
                <div className="space-y-0.5 pl-2">
                  {group.items.map(item => renderNavItem(item, group))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-cyan-500/20 p-4 flex-shrink-0 bg-gradient-to-r from-slate-900/90 to-slate-800/90">
        <div className="flex items-center space-x-3">
          <Avatar className="w-11 h-11 border-2 border-cyan-400 shadow-lg">
            <AvatarImage
              src={(user as any)?.profileImageUrl || ""}
              alt="User avatar"
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-purple-600 text-white font-semibold">
              {getInitials((user as any)?.firstName, (user as any)?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-cyan-200 truncate">
              {(user as any)?.firstName && (user as any)?.lastName
                ? `${(user as any).firstName} ${(user as any).lastName}`
                : (user as any)?.email || "User"
              }
            </p>
            <p className="text-xs text-cyan-400 truncate font-medium">
              {(user as any)?.email}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogoutConfirm(true)}
                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 p-2 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="bg-gray-900 border-cyan-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Sign Out?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to sign out of C.A.R.E.N.™?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradeSheet
        open={!!lockedFeature}
        onClose={() => setLockedFeature(null)}
        featureName={lockedFeature?.name ?? ""}
        requiredPlan={lockedPlan}
      />
    </div>
  );
}
