'use client';

import Link from 'next/link';

export default function LearnerHomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-3xl mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          
          {/* Heading */}
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to ProjectHub
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Gain real-world experience through industry-backed projects. Build your portfolio while learning from the best.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            icon="🎯"
            title="Real Projects"
            description="Work on actual projects from leading companies across various industries"
          />
          <FeatureCard
            icon="🚀"
            title="Build Your Portfolio"
            description="Create tangible work samples that showcase your skills to future employers"
          />
          <FeatureCard
            icon="🎓"
            title="Learn & Grow"
            description="Gain practical experience and develop in-demand skills through hands-on work"
          />
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Login Card */}
          <Link href="/learner/login">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-blue-500/20 group cursor-pointer">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Already a Member?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Sign in to continue your learning journey and access your applications
              </p>
              <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-2 transition-transform">
                Sign In
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Register Card */}
          <Link href="/learner/register">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-3xl shadow-2xl p-8 border-2 border-blue-600 dark:border-blue-700 hover:shadow-blue-500/50 transition-all duration-300 group cursor-pointer">
              <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                New Here?
              </h2>
              <p className="text-blue-100 mb-6">
                Create your free account and start exploring exciting project opportunities today
              </p>
              <div className="flex items-center text-white font-semibold group-hover:translate-x-2 transition-transform">
                Get Started
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
          <StatCard value="500+" label="Active Projects" />
          <StatCard value="10K+" label="Learners" />
          <StatCard value="100+" label="Partner Companies" />
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <Link href="/about" className="hover:text-blue-600 dark:hover:text-blue-400">
              About
            </Link>
            {' · '}
            <Link href="/support" className="hover:text-blue-600 dark:hover:text-blue-400">
              Support
            </Link>
            {' · '}
            <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400">
              Privacy
            </Link>
            {' · '}
            <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400">
              Terms
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
        {value}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {label}
      </div>
    </div>
  );
}
