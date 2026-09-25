'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  const locale = useLocale();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-[#F2F0FF]">
      <div className="max-w-md w-full text-center glass-card-solid border border-[#5C1D3A]/20 rounded-2xl p-8 shadow-glass-lg">
        <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-[#FEF2F2] border border-[#F87171]/40 mb-6">
          <ShieldAlert className="w-8 h-8 text-[#F87171]" />
        </div>

        <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#991B1B] bg-[#FEF2F2] px-3 py-1 rounded-full border border-[#F87171]/40 mb-3">
          Error 403 · Access Restricted
        </span>

        <h1 className="text-2xl font-extrabold text-[#0F0F12] tracking-tight mb-2">
          Permission Denied
        </h1>

        <p className="text-sm text-[#475569] mb-8 leading-relaxed">
          You don't have permission to access this administrative page. If you believe this is an error, please contact your workspace administrator.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/${locale}/dashboard`}
            className="btn-primary-black w-full sm:w-auto py-2.5 px-5 rounded-xl text-xs font-semibold shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 text-[#F6E27A]" />
            <span>Return to Dashboard</span>
          </Link>
          <Link
            href={`/${locale}`}
            className="btn-secondary-glass w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-semibold"
          >
            <Home className="w-4 h-4 mr-1 text-[#64748B]" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
