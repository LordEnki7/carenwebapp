import { useState } from 'react';
import carenLogo from "@assets/caren-icon-square.png";
import {
  Menu, X, Home, Shield, MessageSquare, Settings, AlertTriangle, LogOut,
  Car, VideoIcon, VolumeX, Zap, Map, FileText, UserCheck, Scale,
  MessageCircle, Wrench, Brain, Cloud, Sliders, MessageSquarePlus,
  ClipboardList, HelpCircle, Monitor, LifeBuoy, ChevronDown, ChevronRight,
  Lock, Search, CreditCard
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAuth, performLogout } from '@/hooks/useAuth';

const navGroups = [
  {
    id: 'emergency',
    label: 'Emergency',
    color: 'text-red-400',
    borderColor: 'border-red-500/30',
    bgColor: 'bg-red-500/10',
    items: [
      { name: 'Emergency Pullover', href: '/emergency-pullover', icon: Car },
      { name: 'De-Escalation Guide', href: '/de-escalation-guide', icon: Shield },
      { name: 'Emergency Sharing', href: '/emergency-sharing', icon: Zap },
      { name: 'Record Incident', href: '/record', icon: VideoIcon },
      { name: 'Police Monitor', href: '/police-monitor', icon: Shield },
      { name: 'Smart Auto-Mute', href: '/smart-auto-mute', icon: VolumeX },
    ],
  },
  {
    id: 'main',
    label: 'Main',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgColor: 'bg-cyan-500/10',
    items: [
      { name: 'Dashboard', href: '/', icon: Home },
      { name: 'Legal Rights Map', href: '/legal-rights-map', icon: Map },
      { name: 'File Complaint', href: '/file-complaint', icon: FileText },
      { name: 'Attorneys', href: '/attorneys', icon: UserCheck },
      { name: 'Find an Attorney', href: '/find-attorney', icon: Search },
      { name: 'Attorney Portal', href: '/attorney-portal', icon: Scale },
      { name: 'Messages', href: '/messages', icon: MessageCircle },
      { name: 'Roadside Assistance', href: '/roadside-assistance', icon: Wrench },
    ],
  },
  {
    id: 'advanced',
    label: 'Advanced',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-500/10',
    items: [
      { name: 'Voice Authentication', href: '/voice-auth', icon: Shield },
      { name: 'Vehicle Readability', href: '/vehicle-readability', icon: Monitor },
      { name: 'Cloud Sync', href: '/cloud-sync', icon: Cloud },
    ],
  },
  {
    id: 'platform',
    label: 'Platform',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    items: [
      { name: 'Feature Picker', href: '/feature-picker', icon: Sliders },
      { name: 'Feedback', href: '/feedback', icon: MessageSquarePlus },
      { name: 'Waitlist', href: '/waitlist', icon: ClipboardList },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    color: 'text-green-400',
    borderColor: 'border-green-500/30',
    bgColor: 'bg-green-500/10',
    items: [
      { name: 'Settings', href: '/settings', icon: Settings },
      { name: 'Account Security', href: '/account-security', icon: Lock },
      { name: 'Help', href: '/help', icon: HelpCircle },
    ],
  },
];

const bottomNavItems = [
  { icon: Home,          label: 'Home',      path: '/' },
  { icon: AlertTriangle, label: 'Emergency', path: '/emergency-pullover' },
  { icon: Shield,        label: 'Rights',    path: '/rights' },
  { icon: UserCheck,     label: 'Attorneys', path: '/attorneys' },
  { icon: CreditCard,    label: 'Plans',     path: '/plans' },
];

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ emergency: true, main: true });
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await performLogout();
    } catch {
      setTimeout(() => { window.location.href = '/'; }, 500);
    }
  };

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isActive = (path: string) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  return (
    <>
      {/* Top header bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-lg border-b border-cyan-500/30">
        <div className="flex items-center justify-between p-4 ios-safe-area">
          <div className="flex items-center space-x-2">
            <img src={carenLogo} alt="CAREN" className="w-8 h-8 rounded-lg object-cover" />
            <div className="text-xl font-bold text-cyan-400">C.A.R.E.N.™ Alert</div>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors touch-friendly"
            aria-label="Open menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Full slide-out menu */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60"
          onClick={() => setIsOpen(false)}
        >
          {/* Drawer — uses flex column so Sign Out sticks to the bottom */}
          <div
            className="fixed left-0 top-0 bottom-0 w-80 bg-gray-900/98 backdrop-blur-lg border-r border-cyan-500/30 flex flex-col z-50"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="p-5 mt-16 border-b border-white/10 flex-shrink-0">
              <p className="text-white/50 text-xs font-medium uppercase tracking-widest">Navigation</p>
            </div>

            {/* Scrollable nav groups */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {navGroups.map(group => (
                <div key={group.id}>
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg mb-1 ${group.bgColor} border ${group.borderColor}`}
                  >
                    <span className={`text-xs font-bold uppercase tracking-widest ${group.color}`}>
                      {group.label}
                    </span>
                    {openGroups[group.id]
                      ? <ChevronDown size={14} className={group.color} />
                      : <ChevronRight size={14} className={group.color} />
                    }
                  </button>

                  {openGroups[group.id] && (
                    <div className="space-y-0.5 mb-2">
                      {group.items.map(item => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all touch-friendly ${
                              active
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                            }`}
                          >
                            <Icon size={18} className={active ? 'text-cyan-400' : 'text-gray-400'} />
                            <span className="font-medium text-sm">{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ── STICKY FOOTER — always visible, no scrolling needed ── */}
            <div
              className="flex-shrink-0 border-t border-white/10 p-3 space-y-2 bg-gray-900/98"
              style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
            >
              {/* Plans & Pricing */}
              <Link href="/plans" onClick={() => setIsOpen(false)}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 hover:border-cyan-400 transition-all cursor-pointer">
                  <CreditCard size={20} className="text-cyan-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-cyan-300">Plans &amp; Pricing</p>
                    <p className="text-xs text-gray-400">View &amp; upgrade your plan</p>
                  </div>
                </div>
              </Link>

              {/* Sign Out */}
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:text-red-200 bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 hover:border-red-400 transition-all touch-friendly"
                >
                  <LogOut size={20} className="flex-shrink-0" />
                  <span className="font-bold text-sm">Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-lg border-t border-cyan-500/30 mobile-nav">
        <div className="flex justify-around items-center py-1 px-1 ios-safe-area">
          {bottomNavItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center px-3 py-1.5 rounded-lg transition-all touch-friendly ${
                  active ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
