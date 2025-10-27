'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth, ROLES } from '@/lib/auth-context';
import Link from 'next/link';

export default function LearnerSidebar() {
  const { user, hasRole } = useAuth();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [applicationStats, setApplicationStats] = useState({
    pending: 0,
    total: 0
  });
  
  // Only show sidebar for learners on learner-accessible routes
  const isLearner = hasRole(ROLES.LEARNER);
  
  // Learner-accessible routes based on role-base-UI-access.md
  const learnerRoutes = [
    '/learner',
    '/projects',
    '/providers',
    '/applications',
    '/profile'
  ];
  
  const isLearnerAccessibleRoute = learnerRoutes.some(route => 
    pathname === route || pathname?.startsWith(route + '/')
  );
  
  const shouldShowSidebar = isLearner && isLearnerAccessibleRoute;
  
  useEffect(() => {
    if (shouldShowSidebar) {
      fetchApplicationStats();
    }
  }, [shouldShowSidebar]);

  const fetchApplicationStats = async () => {
    try {
      const response = await fetch('/api/applications/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          setApplicationStats({
            pending: data.stats.pendingApplications || 0,
            total: data.stats.totalApplications || 0
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch application stats:', error);
    }
  };
  
  if (!shouldShowSidebar) return null;

  const sidebarItems = [
    {
      section: 'Overview',
      items: [
        { 
          href: '/learner/dashboard', 
          label: 'Dashboard', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          )
        }
      ]
    },
    {
      section: 'Discover',
      items: [
        { 
          href: '/projects', 
          label: 'Browse Projects', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )
        },
        { 
          href: '/providers', 
          label: 'View Providers', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )
        }
      ]
    },
    {
      section: 'My Journey',
      items: [
        { 
          href: '/learner/applications', 
          label: 'My Applications',
          badge: applicationStats.pending > 0 ? applicationStats.pending : undefined,
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        },
        { 
          href: '/applications', 
          label: 'Application Status', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          )
        }
      ]
    },
    {
      section: 'Settings',
      items: [
        { 
          href: '/learner/profile', 
          label: 'My Profile', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )
        }
      ]
    }
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <aside 
      className={`fixed top-16 left-0 h-full bg-gradient-to-b from-blue-50/95 to-purple-50/95 dark:from-gray-900/95 dark:to-gray-800/95 backdrop-blur-sm border-r border-blue-200/30 dark:border-gray-700/30 transition-all duration-300 z-50 ${
        isExpanded ? 'w-64' : 'w-16'
      } hover:w-64`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 py-6 overflow-y-auto">
          {sidebarItems.map((section) => (
            <div key={section.section} className="mb-8">
              {isExpanded && (
                <div className="px-4 mb-3">
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    {section.section}
                  </div>
                </div>
              )}
              <nav className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-3 transition-all duration-200 group ${
                      isActive(item.href)
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600'
                        : 'text-gray-600 hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-gray-800/50'
                    }`}
                    title={!isExpanded ? item.label : ''}
                  >
                    <div className={`transition-colors ${
                      isActive(item.href)
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400'
                    }`}>
                      {item.icon}
                    </div>
                    <span 
                      className={`ml-3 text-sm font-medium transition-all duration-300 flex-1 ${
                        isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.badge && isExpanded && (
                      <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 dark:bg-blue-500 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
        
        {/* User Info & Toggle */}
        <div className="border-t border-blue-200/30 dark:border-gray-700/30 p-4">
          {isExpanded && user && (
            <div className="mb-3 px-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                  {user.name?.charAt(0).toUpperCase() || 'L'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.name || 'Learner'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center w-full py-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <svg 
              className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {isExpanded && (
              <span className="ml-2 text-sm font-medium">Collapse</span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
