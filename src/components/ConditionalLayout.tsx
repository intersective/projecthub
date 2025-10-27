'use client';

import { usePathname } from 'next/navigation';
import { useIsAdmin, useAuth, ROLES } from '@/lib/auth-context';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isAdmin = useIsAdmin();
  const { hasRole } = useAuth();
  
  // Check if we should show admin sidebar
  const shouldShowAdminSidebar = isAdmin;
  
  // Check if we should show learner sidebar
  const isLearner = hasRole(ROLES.LEARNER);
  const learnerRoutes = ['/learner', '/projects', '/providers', '/applications', '/profile'];
  const isLearnerAccessibleRoute = learnerRoutes.some(route => 
    pathname === route || pathname?.startsWith(route + '/')
  );
  const shouldShowLearnerSidebar = isLearner && isLearnerAccessibleRoute && !shouldShowAdminSidebar;
  
  // Check if this is a route that should have no padding
  const isHomeRoute = pathname === '/';
  const isLoginRoute = pathname === '/login' || pathname === '/learner/login' || pathname === '/learner/register';
  const padding = isHomeRoute || isLoginRoute ? '' : 'p-6';
  
  if (shouldShowAdminSidebar) {
    // Manager/admin routes: with admin sidebar
    return (
      <main className="lg:pl-16 min-h-screen transition-all duration-300">
        <div className={padding}>
          {children}
        </div>
      </main>
    );
  }
  
  if (shouldShowLearnerSidebar) {
    // Learner routes: with learner sidebar
    return (
      <main className="lg:pl-16 min-h-screen transition-all duration-300">
        <div className={padding}>
          {children}
        </div>
      </main>
    );
  }
  
  // Default routes: no sidebar but with padding
  return (
    <main className="min-h-screen">
      <div className={padding}>
        {children}
      </div>
    </main>
  );
}
