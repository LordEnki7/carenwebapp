import { useState } from 'react';
import { Menu, X, Home, Shield, MessageSquare, Settings, AlertTriangle, LogOut } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAuth, performLogout } from '@/hooks/useAuth';

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  const handleLogout = async () => {
    console.log('📱 [MOBILE_NAV] Logout button clicked!');
    setIsOpen(false);
    try {
      console.log('📱 [MOBILE] About to call performLogout()...');
      const { performLogout } = await import('@/hooks/useAuth');
      await performLogout();
      console.log('📱 [MOBILE] Logout completed');
    } catch (error) {
      console.error('📱 [MOBILE] Error caught:', error);
      // Silent fallback redirect
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/', color: 'cyan' },
    { icon: AlertTriangle, label: 'Emergency', path: '/emergency-pullover', color: 'red' },
    { icon: Shield, label: 'Rights', path: '/rights', color: 'blue' },
    { icon: MessageSquare, label: 'Attorneys', path: '/attorneys', color: 'purple' },
    { icon: Settings, label: 'Settings', path: '/settings', color: 'gray' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  return (
    <>
      {/* Mobile Header with Hamburger Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-lg border-b border-cyan-500/30">
        <div className="flex items-center justify-between p-4 ios-safe-area">
          <div className="text-xl font-bold text-cyan-400">C.A.R.E.N.™</div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors touch-friendly"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-out Menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsOpen(false)}>
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-gray-900/98 backdrop-blur-lg border-r border-cyan-500/30 transform transition-transform duration-300 ios-safe-area">
            <div className="p-6 mt-16">
              <div className="space-y-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-3 p-4 rounded-lg transition-all duration-200 touch-friendly mobile-touch-target ${
                        active 
                          ? `bg-${item.color}-500/20 text-${item.color}-300 border border-${item.color}-500/30` 
                          : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                      }`}
                    >
                      <Icon size={24} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
                
                {/* Logout Button (only show if authenticated) */}
                {isAuthenticated && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 p-4 rounded-lg transition-all duration-200 touch-friendly mobile-touch-target text-red-300 hover:text-red-200 hover:bg-red-500/10 border border-red-500/30 mt-4"
                  >
                    <LogOut size={24} />
                    <span className="font-medium">Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar (Alternative Mobile Navigation) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-lg border-t border-cyan-500/30 mobile-nav">
        <div className="flex justify-around items-center p-2 ios-safe-area">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 touch-friendly ${
                  active 
                    ? `text-${item.color}-400` 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}