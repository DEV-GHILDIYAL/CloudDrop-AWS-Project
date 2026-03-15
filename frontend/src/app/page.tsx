'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, ArrowRight } from 'lucide-react';
import { signIn, signUp, confirmSignUp } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import Image from 'next/image';


export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authCode, setAuthCode] = useState('');

  type AuthState = 'signIn' | 'signUp' | 'confirmSignUp';
  const [authState, setAuthState] = useState<AuthState>('signIn');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (authState === 'signIn') {
        const { isSignedIn, nextStep } = await signIn({
          username: email,
          password,
        });

        if (isSignedIn) {
          router.push('/dashboard');
        } else if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
          setAuthState('confirmSignUp');
          setErrorMsg('Please confirm your email first.');
        }

      } else if (authState === 'signUp') {
        const { isSignUpComplete, nextStep } = await signUp({
          username: email,
          password,
          options: {
            userAttributes: {
              email,
            }
          }
        });

        if (!isSignUpComplete && nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
          setAuthState('confirmSignUp');
        }

      } else if (authState === 'confirmSignUp') {
        const { isSignUpComplete } = await confirmSignUp({
          username: email,
          confirmationCode: authCode
        });

        if (isSignUpComplete) {
          // Auto login after verification
          await signIn({ username: email, password });
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Authentication error', error);
      setErrorMsg(error.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-blue-100 dark:border-gray-700">
              <Image src="/Logo.png" alt="CloudDrop Logo" width={64} height={64} className="object-contain drop-shadow-md" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Welcome to CloudDrop
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-8 text-sm">
            {authState === 'confirmSignUp' ? 'Verify your email address' : 'Secure Serverless File Sharing'}
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {(authState === 'signIn' || authState === 'signUp') ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="••••••••"
                  />
                  {authState === 'signUp' && (
                    <p className="mt-1 text-xs text-gray-500">Requires 8+ characters, uppercase, lowercase, and a number.</p>
                  )}
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Verification Code
                </label>
                <p className="text-xs text-gray-500 mb-3">Check {email} for the code.</p>
                <input
                  type="text"
                  required
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors tracking-widest font-mono text-center"
                  placeholder="123456"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-70 mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {authState === 'signIn' && 'Sign In'}
                  {authState === 'signUp' && 'Create Account'}
                  {authState === 'confirmSignUp' && 'Verify & Continue'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {authState !== 'confirmSignUp' && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthState(authState === 'signIn' ? 'signUp' : 'signIn');
                  setErrorMsg('');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
              >
                {authState === 'signIn' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
