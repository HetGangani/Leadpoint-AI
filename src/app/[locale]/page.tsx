'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  PhoneCall,
  Sparkles,
  Target,
  BarChart3,
  ShieldCheck,
  Database,
  ArrowRight,
  Kanban,
  Activity,
  Globe2,
} from 'lucide-react';

export default function HomePage() {
  const locale = useLocale();

  return (
    <main className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Hero Section */}
      <section className="px-6 py-16 sm:py-20 max-w-7xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs sm:text-sm px-4 py-1.5 rounded-full mb-6">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span>Multilingual • Real-time Voice AI • Hot Leads Kanban • Superadmin Telemetry</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 max-w-4xl leading-tight">
          Autonomous B2B Lead Discovery & Voice AI Sales Platform
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed">
          LeadPoint AI monitors social platforms for high-intent requirements, enriches tech stacks, and deploys autonomous voice agents with Gemini LLM & Web Speech API.
        </p>

        {/* Hero CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link
            href={`/${locale}/analytics`}
            className="inline-flex items-center space-x-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm shadow-xl shadow-blue-500/25 transition transform hover:-translate-y-0.5"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Open Sales Analytics & Kanban</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/${locale}/admin`}
            className="inline-flex items-center space-x-2.5 px-6 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-blue-500 text-slate-200 hover:text-white font-semibold text-sm shadow-xl transition transform hover:-translate-y-0.5"
          >
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <span>Access Superadmin Portal</span>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full text-left">
          <Link
            href={`/${locale}/analytics`}
            className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl hover:border-blue-500/50 transition block group"
          >
            <div className="bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition">
              <Kanban className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-white text-lg mb-2 group-hover:text-blue-400 transition">
              Hot Leads Kanban
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Track discovered intent opportunities across stages (New, Qualified, Contacted, Interested, Unresponsive).
            </p>
          </Link>

          <Link
            href={`/${locale}/admin`}
            className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl hover:border-amber-500/50 transition block group"
          >
            <div className="bg-amber-500/10 w-12 h-12 rounded-xl flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-white text-lg mb-2 group-hover:text-amber-400 transition">
              Superadmin Telemetry
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              System health status, DB latency monitors, voice minute usage caps, and security audit log table.
            </p>
          </Link>

          <Link
            href={`/${locale}/leads`}
            className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl hover:border-purple-500/50 transition block group"
          >
            <div className="bg-purple-500/10 w-12 h-12 rounded-xl flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-white text-lg mb-2 group-hover:text-purple-400 transition">
              Intent Discovery
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Harvests public requirement posts across LinkedIn and X/Twitter with relevance scoring and tech enrichment.
            </p>
          </Link>

          <Link
            href={`/${locale}/voice`}
            className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl hover:border-emerald-500/50 transition block group"
          >
            <div className="bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition">
              <PhoneCall className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-white text-lg mb-2 group-hover:text-emerald-400 transition">
              Voice AI Simulator
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Executes autonomous AI phone calls with sentiment auto-dispositioning and transcript summaries.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
