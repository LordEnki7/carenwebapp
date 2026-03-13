import { useEffect, useState } from 'react';
import MobileNavigation from './MobileNavigation';
import Sidebar from './Sidebar';

interface MobileResponsiveLayoutProps {
  children: React.ReactNode;
  disableTransitions?: boolean;
}

function MobileResponsiveLayout({ children, disableTransitions = false }: MobileResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}
      
      {/* Mobile Navigation */}
      {isMobile && <MobileNavigation />}
      
      {/* Main Content */}
      <div className={`
        ${!disableTransitions ? 'transition-all duration-300' : ''}
        ${isMobile 
          ? 'pt-16 pb-20 px-4 mobile-responsive' 
          : 'pl-72 p-8'
        }
        ${isMobile ? 'mobile-text-adjust' : ''}
      `} style={disableTransitions ? { transition: 'none', transform: 'none' } : {}}>
        <div className={`
          max-w-7xl mx-auto
          ${isMobile ? 'mobile-grid' : ''}
        `}>
          {children}
        </div>
      </div>
    </div>
  );
}

export { MobileResponsiveLayout };
export default MobileResponsiveLayout;