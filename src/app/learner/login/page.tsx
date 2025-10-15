'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type LoginState = {
  email: string;
  password: string;
  status: 'idle' | 'submitting' | 'success' | 'error';
  error?: string;
  rememberMe: boolean;
};

export default function LearnerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<LoginState>({
    email: '',
    password: '',
    status: 'idle',
    rememberMe: false
  });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Show success message if coming from registration
    if (searchParams.get('registered') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, status: 'submitting', error: undefined }));

    try {
      const res = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: state.email.toLowerCase().trim(),
          password: state.password,
        })
      });

      // Check if response has content
      const contentType = res.headers.get('content-type');
      const hasJsonContent = contentType?.includes('application/json');

      if (!res.ok) {
        let errorMessage = 'Invalid email or password';
        
        if (hasJsonContent) {
          try {
            const error = await res.json();
            errorMessage = error.message || error.error || errorMessage;
          } catch {
            // If JSON parsing fails, try text
            const text = await res.text();
            if (text) errorMessage = text;
          }
        } else {
          const text = await res.text();
          if (text) errorMessage = text;
        }
        
        throw new Error(errorMessage);
      }

      // Parse successful response
      let sessionData = null;
      if (hasJsonContent) {
        try {
          sessionData = await res.json();
        } catch {
          // Empty or invalid JSON on success is OK
          sessionData = { success: true };
        }
      }
      
      console.log('[Learner] Login success:', sessionData);

      setState(prev => ({ ...prev, status: 'success' }));
      
      // Redirect to dashboard
      router.push('/learner/dashboard');
    } catch (error: any) {
      console.error('[Learner] Login error:', error);
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: error.message || 'Login failed. Please check your credentials.' 
      }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to continue your learning journey
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-4 rounded-lg mb-6 flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Registration successful!</p>
              <p className="text-sm mt-1">Please sign in with your new account.</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white"
                placeholder="john@example.com"
                value={state.email}
                onChange={(e) => setState(prev => ({ ...prev, email: e.target.value }))}
                required
                disabled={state.status === 'submitting'}
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <Link
                  href="/learner/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Forgot?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white"
                placeholder="••••••••"
                value={state.password}
                onChange={(e) => setState(prev => ({ ...prev, password: e.target.value }))}
                required
                disabled={state.status === 'submitting'}
                autoComplete="current-password"
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                checked={state.rememberMe}
                onChange={(e) => setState(prev => ({ ...prev, rememberMe: e.target.checked }))}
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Remember me for 30 days
              </label>
            </div>

            {/* Error Message */}
            {state.error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{state.error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={state.status === 'submitting' || !state.email || !state.password}
            >
              {state.status === 'submitting' ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                New to the platform?
              </span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <Link 
              href="/learner/register"
              className="inline-flex items-center justify-center w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors gap-2"
            >
              Create Learner Account
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Help Links */}
        <div className="mt-6 text-center space-y-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span>Need help? </span>
            <Link href="/support" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
