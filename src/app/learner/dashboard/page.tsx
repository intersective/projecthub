'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

interface DashboardStats {
  totalApplications: number;
  activeProjects: number;
  completedProjects: number;
  pendingApplications: number;
}

export default function LearnerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingApplications: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchDashboardData();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/current-user');
      if (!res.ok) throw new Error('Not authenticated');
      
      const userData = await res.json();
      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email,
        role: userData.effectiveRole?.name || 'learner',
        avatar: undefined
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/learner/login');
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch applications stats
      const appsRes = await fetch('/api/applications/stats');
      if (appsRes.ok) {
        const data = await appsRes.json();
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'Learner'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your learning journey
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Applications"
            value={stats.totalApplications}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            color="blue"
          />
          <StatCard
            title="Pending Review"
            value={stats.pendingApplications}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="yellow"
          />
          <StatCard
            title="Active Projects"
            value={stats.activeProjects}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            color="green"
          />
          <StatCard
            title="Completed"
            value={stats.completedProjects}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <QuickActionCard
            title="Browse Projects"
            description="Discover new projects matching your skills and interests"
            icon="🔍"
            href="/projects"
            color="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
            borderColor="border-blue-200 dark:border-blue-800"
          />
          <QuickActionCard
            title="My Applications"
            description="Track and manage your project applications"
            icon="📋"
            href="/learner/applications"
            color="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
            borderColor="border-purple-200 dark:border-purple-800"
          />
          <QuickActionCard
            title="Profile Settings"
            description="Update your profile and preferences"
            icon="⚙️"
            href="/learner/profile"
            color="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20"
            borderColor="border-gray-200 dark:border-gray-700"
          />
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Getting Started
          </h2>
          <div className="space-y-4">
            <GuidanceCard
              step={1}
              title="Complete Your Profile"
              description="Add your skills, interests, and experience to help match with the right projects"
              action={
                <Link
                  href="/learner/profile"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Update Profile →
                </Link>
              }
            />
            <GuidanceCard
              step={2}
              title="Browse Available Projects"
              description="Explore our curated collection of real-world projects across various industries"
              action={
                <Link
                  href="/projects"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View Projects →
                </Link>
              }
            />
            <GuidanceCard
              step={3}
              title="Apply to Projects"
              description="Submit applications to projects that match your goals and skill level"
              action={
                <Link
                  href="/projects"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Start Applying →
                </Link>
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  };

  return (
    <div className={`${colorClasses[color]} rounded-2xl p-6 border`}>
      <div className="flex items-center justify-between mb-3">
        <div className="opacity-80">{icon}</div>
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <h3 className="text-sm font-medium opacity-90">{title}</h3>
    </div>
  );
}

function QuickActionCard({ title, description, icon, href, color, borderColor }: {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
  borderColor: string;
}) {
  return (
    <Link
      href={href}
      className={`${color} ${borderColor} border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group`}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
      <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
        Get Started
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

function GuidanceCard({ step, title, description, action }: {
  step: number;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
        {step}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{description}</p>
        {action}
      </div>
    </div>
  );
}
