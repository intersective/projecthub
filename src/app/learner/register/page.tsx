'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sendEmailOtp, verifyEmailOtp } from '@/lib/auth-client';

type RegistrationState = {
  email: string;
  fullName: string;
  step: 'info' | 'verify';
  otp: string;
  status: 'idle' | 'submitting' | 'success' | 'error';
  error?: string;
  message?: string;
};

export default function LearnerRegisterPage() {
  const router = useRouter();
  const [state, setState] = useState<RegistrationState>({
    email: '',
    fullName: '',
    step: 'info',
    otp: '',
    status: 'idle'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, status: 'submitting', error: undefined, message: undefined }));

    try {
      // Send OTP code for email verification
      const result = await sendEmailOtp(state.email.toLowerCase().trim(), 'email-verification');

      if (result.error) {
        setState(prev => ({ 
          ...prev, 
          status: 'error', 
          error: result.error.message || 'Failed to send verification code' 
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          step: 'verify',
          status: 'idle',
          message: 'Verification code sent to your email' 
        }));
      }
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: error.message || 'Failed to send verification code' 
      }));
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, status: 'submitting', error: undefined }));

    try {
      // Verify OTP and create user
      const result = await verifyEmailOtp(state.email.toLowerCase().trim(), state.otp);
      
      if (result?.error) {
        setState(prev => ({ 
          ...prev, 
          status: 'error', 
          error: result.error.message || 'Invalid verification code' 
        }));
        return;
      }

      console.log('[Learner] Registration success via OTP');

      // Assign learner role
      try {
        await fetch('/api/auth/learner-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: state.email.toLowerCase().trim(),
          })
        });
      } catch (roleError) {
        console.warn('[Learner] Role assignment failed:', roleError);
      }

      setState(prev => ({ ...prev, status: 'success' }));
      
      // Redirect to learner dashboard (user is now authenticated)
      router.push('/learner/dashboard');
    } catch (error: any) {
      console.error('[Learner] Registration error:', error);
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: error.message || 'Verification failed. Please try again.' 
      }));
    }
  };

  const isFormValid = state.fullName.trim() && state.email.trim();

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
            Start Your Learning Journey
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create your learner account to access projects
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          {state.step === 'info' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white"
                  placeholder="John Doe"
                  value={state.fullName}
                  onChange={(e) => setState(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                  disabled={state.status === 'submitting'}
                  autoComplete="name"
                  autoFocus
                />
              </div>

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
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  We'll send you a verification code
                </p>
              </div>

              {/* Success Message */}
              {state.message && (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-4 rounded-lg text-sm flex items-start gap-3">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{state.message}</span>
                </div>
              )}

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
                disabled={state.status === 'submitting' || !isFormValid}
              >
                {state.status === 'submitting' ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Code...
                  </>
                ) : (
                  <>
                    Continue
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white text-center text-2xl tracking-widest"
                  placeholder="000000"
                  value={state.otp}
                  onChange={(e) => setState(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                  disabled={state.status === 'submitting'}
                  autoFocus
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Enter the 6-digit code sent to {state.email}
                </p>
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

              {/* Submit Buttons */}
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={state.status === 'submitting' || state.otp.length !== 6}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {state.status === 'submitting' ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    'Verify & Create Account'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setState(prev => ({ ...prev, step: 'info', otp: '', error: undefined, message: undefined }));
                  }}
                  className="flex-1 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium py-3 px-4 transition-colors"
                >
                  Back
                </button>
              </div>
            </form>
          )}

          {/* Login Link */}
          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
            </span>
            <Link 
              href="/learner/login" 
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Sign in here
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
