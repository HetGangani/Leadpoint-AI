'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Zap, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

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

      // If a specific redirect was requested (e.g. from middleware), preserve it
      if (redirectParam && redirectParam.startsWith('/')) {
        window.location.href = redirectParam;
      } else {
        // Direct to role dashboard
        if (data.data?.user?.role === 'ADMIN') {
          window.location.href = `/${locale}/admin`;
        } else {
          window.location.href = `/${locale}/analytics`;
        }
      }
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
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F2F0FF]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href={`/${locale}`} className="inline-flex items-center space-x-2.5 mb-6 group">
          <div className="bg-[#0F0F12] border border-[#E5C158]/40 text-[#F6E27A] p-2.5 rounded-xl shadow-glass-sm group-hover:scale-105 transition-transform">
            <Zap className="h-5 w-5 text-[#F6E27A]" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-[#0F0F12]">
            LeadPoint <span className="text-[#5C1D3A]">AI</span>
          </span>
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#0F0F12]">
          Sign in to your account
        </h1>
        <p className="mt-2 text-sm text-[#475569]">
          Access your sales pipeline, AI voice agents, and lead intelligence
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-card-solid py-8 px-6 sm:px-10 rounded-2xl shadow-glass-lg border border-[#5C1D3A]/18">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#F87171]/40 text-[#991B1B] text-sm flex items-start space-x-2.5">
              <AlertCircle className="h-5 w-5 text-[#F87171] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold text-[#0F0F12] uppercase tracking-wider mb-1.5">
                Business Email
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.smith@cloudenterprise.io"
                  className="block w-full pl-9 pr-3 py-2.5 bg-white/90 border border-[#5C1D3A]/20 rounded-xl text-[#0F0F12] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#E5C158] focus:border-[#5C1D3A]/40 text-sm transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#0F0F12] uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 bg-white/90 border border-[#5C1D3A]/20 rounded-xl text-[#0F0F12] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#E5C158] focus:border-[#5C1D3A]/40 text-sm transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary-black w-full py-3 px-4 rounded-xl text-sm font-semibold shadow-glass-sm mt-2"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4 ml-1.5 text-[#F6E27A]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-[#5C1D3A]/12">
            <span className="block text-xs text-[#64748B] font-semibold mb-2.5 text-center">
              Quick One-Click Demo Credentials
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={fillDemoClient}
                className="inline-flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl border border-[#5C1D3A]/18 bg-[#E6F0FA]/70 hover:bg-[#F2F0FF] text-xs font-semibold text-[#0F0F12] transition shadow-xs"
              >
                <UserCheck className="h-3.5 w-3.5 text-[#5C1D3A]" />
                <span>Client Account</span>
              </button>
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="inline-flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-xl border border-[#E5C158]/40 bg-[#FEF3C7]/60 hover:bg-[#FEF3C7] text-xs font-semibold text-[#92400E] transition shadow-xs"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-[#E5C158]" />
                <span>Admin Account</span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-[#475569]">
          Don&apos;t have an account yet?{' '}
          <Link
            href={`/${locale}/register`}
            className="font-bold text-[#5C1D3A] hover:underline underline-offset-4"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
