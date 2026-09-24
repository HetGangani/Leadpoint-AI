'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Zap, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const locale = useLocale();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      // Successful login
      window.location.href = `/${locale}/analytics`;
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoClient = () => {
    setEmail('client@cloudscale-solutions.com');
    setPassword('password123');
    setError(null);
  };

  const fillDemoAdmin = () => {
    setEmail('admin@leadpoint.ai');
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href={`/${locale}`} className="inline-flex items-center space-x-2.5 group mb-4">
          <div className="bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-2.5 rounded-2xl shadow-xl shadow-blue-500/20 group-hover:scale-105 transition">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
            LeadPoint AI
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Access intent lead pipelines, voice AI agents & analytics
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 border border-slate-800 py-8 px-4 shadow-2xl rounded-3xl sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Business Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center space-x-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <span className="block text-xs text-slate-500 font-medium mb-3 text-center">
              Quick One-Click Demo Credentials
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={fillDemoClient}
                className="inline-flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500 text-xs font-medium text-slate-300 hover:text-white transition"
              >
                <UserCheck className="h-3.5 w-3.5 text-blue-400" />
                <span>Fill Client Account</span>
              </button>
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="inline-flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500 text-xs font-medium text-slate-300 hover:text-white transition"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                <span>Fill Admin Account</span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don&apos;t have an account yet?{' '}
          <Link
            href={`/${locale}/register`}
            className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
