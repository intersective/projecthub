'use client';

import { useAuth, ROLES } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ProjectPreferenceAnalytics from '@/components/ProjectPreferenceAnalytics';

export default function ProjectAnalyticsPage() {
  const { user, isLoading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    
    // Only allow platform admins and managers to access analytics
    if (!isLoading && user && !hasRole(ROLES.PLATFORM_ADMIN) && !hasRole(ROLES.MANAGER) && !hasRole(ROLES.EDUCATOR)) {
      router.push('/projects');
    }
  }, [user, isLoading, hasRole, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl text-gray-900 dark:text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user || (!hasRole(ROLES.PLATFORM_ADMIN) && !hasRole(ROLES.MANAGER) && !hasRole(ROLES.EDUCATOR))) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Go back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Project Preference Analytics
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-14">
            Analyze learner project preferences to understand demand and optimize project offerings
          </p>
        </div>

        {/* Analytics Component */}
        <ProjectPreferenceAnalytics />
      </div>
    </div>
  );
}
