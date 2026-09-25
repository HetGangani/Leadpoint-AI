'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Zap, Lock, Mail, User, Building, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const locale = useLocale();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          companyName: companyName || `${name}'s Organization`,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed. Please check your inputs.');
      }

      // Registration successful, session cookie set by API
      window.location.href = `/${locale}/analytics`;
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
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
          Create your account
        </h1>
        <p className="mt-2 text-sm text-[#475569]">
          Start sourcing high-intent leads and automating voice SDR outreach
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

          <form className="space-y-4" onSubmit={handleRegister}>
            <div>
              <label className="block text-xs font-bold text-[#0F0F12] uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sarah Jenkins"
                  className="block w-full pl-9 pr-3 py-2.5 bg-white/90 border border-[#5C1D3A]/20 rounded-xl text-[#0F0F12] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#E5C158] focus:border-[#5C1D3A]/40 text-sm transition"
                />
              </div>
            </div>

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
                  placeholder="sarah@enterprise-solutions.com"
                  className="block w-full pl-9 pr-3 py-2.5 bg-white/90 border border-[#5C1D3A]/20 rounded-xl text-[#0F0F12] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#E5C158] focus:border-[#5C1D3A]/40 text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F0F12] uppercase tracking-wider mb-1.5">
                Company / Organization
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Building className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enterprise Cloud Solutions"
                  className="block w-full pl-9 pr-3 py-2.5 bg-white/90 border border-[#5C1D3A]/20 rounded-xl text-[#0F0F12] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#E5C158] focus:border-[#5C1D3A]/40 text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F0F12] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="block w-full pl-9 pr-3 py-2.5 bg-white/90 border border-[#5C1D3A]/20 rounded-xl text-[#0F0F12] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#E5C158] focus:border-[#5C1D3A]/40 text-sm transition"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary-black w-full py-3 px-4 rounded-xl text-sm font-semibold shadow-glass-sm"
              >
                {loading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="h-4 w-4 ml-1.5 text-[#F6E27A]" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-[#5C1D3A]/12">
            <div className="flex items-center space-x-2 text-xs text-[#475569]">
              <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
              <span>Includes 14-day trial of Starter Plan (250 voice minutes)</span>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-[#475569]">
          Already have an account?{' '}
          <Link
            href={`/${locale}/login`}
            className="font-bold text-[#5C1D3A] hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
