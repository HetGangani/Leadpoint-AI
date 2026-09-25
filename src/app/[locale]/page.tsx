'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  PhoneCall,
  Target,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  CalendarCheck,
  Users2,
  Sparkles,
  Search,
  MessageSquare,
  Clock,
  Layers,
  Zap,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  Globe,
  Headphones,
  Calendar,
  Send,
  Check,
  ChevronRight,
  Bot,
  UserCheck,
  Workflow,
  Compass,
} from 'lucide-react';
import GlassCard from '@/components/GlassCard';

export default function HomePage() {
  const locale = useLocale();
  const [selectedFactor, setSelectedFactor] = useState<string>('timeline');

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F0FF] text-[#0F0F12] relative overflow-hidden">
      {/* ============================================================ */}
      {/* HERO SECTION                                                 */}
      {/* ============================================================ */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-16 sm:pt-14 sm:pb-24 max-w-7xl mx-auto w-full">
        {/* Subtle ambient low-opacity glow shapes behind product visual */}
        <div className="absolute top-1/4 right-[10%] w-96 h-96 bg-[#E6F0FA] rounded-full blur-3xl pointer-events-none opacity-60" />
        <div className="absolute top-1/3 right-[25%] w-80 h-80 bg-[#F6E27A]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-[5%] w-72 h-72 bg-[#5C1D3A]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          {/* LEFT: Copy, Badge, CTAs, Capability Tags */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Small Badge */}
            <div className="inline-flex items-center space-x-2 bg-[#E6F0FA]/85 border border-[#5C1D3A]/18 text-[#0F0F12] text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-glass-sm backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-[#34D399] animate-pulse" />
              <span className="font-bold text-[#0F0F12]">AI Sales Intelligence</span>
              <span className="text-[#64748B]">•</span>
              <span className="text-[#475569]">Deterministic Orchestration</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0F0F12] leading-[1.12]">
              Turn Every Lead Into{' '}
              <span className="text-gold-gradient block sm:inline">
                the Right Next Action.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-[#475569] leading-relaxed font-normal max-w-xl">
              LeadPoint-AI does not merely make automated calls. We discover high-intent buyer signals, qualify prospects across multi-turn voice conversations, and hand qualified opportunities directly to your human sales reps.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                href={`/${locale}/register`}
                className="btn-primary-black py-3.5 px-7 rounded-xl text-sm"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 ml-2 text-[#F6E27A]" />
              </Link>
              <a
                href="#how-it-works"
                className="btn-secondary-glass py-3.5 px-6 rounded-xl text-sm"
              >
                <span>Explore Platform</span>
                <Compass className="w-4 h-4 ml-2 text-[#64748B]" />
              </a>
            </div>

            {/* Real Product Capability Indicators */}
            <div className="pt-4 border-t border-[#5C1D3A]/12">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2">
                Core Autonomous Engine
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[#0F0F12]">
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-[#E6F0FA]/80 border border-[#5C1D3A]/15 backdrop-blur-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
                  <span>AI Qualification</span>
                </span>
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-[#E6F0FA]/80 border border-[#5C1D3A]/15 backdrop-blur-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#E5C158]" />
                  <span>Lead Intelligence</span>
                </span>
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-[#E6F0FA]/80 border border-[#5C1D3A]/15 backdrop-blur-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
                  <span>Voice Outreach</span>
                </span>
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-[#E6F0FA]/80 border border-[#5C1D3A]/15 backdrop-blur-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#FBBF24]" />
                  <span>Human Handoff</span>
                </span>
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-[#E6F0FA]/80 border border-[#5C1D3A]/15 backdrop-blur-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
                  <span>Meeting Conversion</span>
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Layered Product Visualization with Realistic Glass Cards */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              {/* Primary App Window Mockup */}
              <div className="bg-[#E6F0FA]/85 backdrop-blur-xl rounded-2xl border border-[#5C1D3A]/20 shadow-glass-lg overflow-hidden">
                {/* Window Header */}
                <div className="px-4 py-3 bg-[#E6F0FA]/95 border-b border-[#5C1D3A]/15 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F87171]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#34D399]" />
                    <span className="text-[11px] font-mono text-[#64748B] ml-2">leadpoint-orchestrator.live</span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#34D399]/40 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
                    <span>Active Session</span>
                  </span>
                </div>

                {/* Window Content */}
                <div className="p-5 space-y-4 bg-gradient-to-b from-[#E6F0FA]/50 to-[#F2F0FF]/80">
                  {/* Lead Summary Row */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#5C1D3A]/10">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0F0F12] border border-[#E5C158]/40 text-[#F6E27A] font-bold flex items-center justify-center text-sm shadow-glass-sm">
                        SJ
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#0F0F12]">Sarah Jenkins</div>
                        <div className="text-xs text-[#475569]">VP IT Operations · Apex Cloud Systems</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F3E8FF] text-[#6B21A8] border border-[#C084FC]/40">
                      QUALIFIED
                    </span>
                  </div>

                  {/* Signal Context */}
                  <div className="p-3.5 rounded-xl bg-[#E6F0FA]/90 border border-[#5C1D3A]/15 text-xs text-[#475569] space-y-1">
                    <div className="font-semibold text-[#0F0F12] flex items-center space-x-1.5">
                      <Search className="w-3.5 h-3.5 text-[#5C1D3A]" />
                      <span>Detected Intent Signal:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#475569]">
                      "Evaluating Microsoft 365 tenant migration partners for Q4 modernization project."
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating Glass Card 1: Lead Score & High Intent */}
              <div className="animate-subtle-float sm:absolute -top-6 -left-6 z-20 mt-4 sm:mt-0 p-4 rounded-2xl glass-card border border-[#5C1D3A]/20 shadow-glass-md max-w-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Lead Score</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#FEF3C7] text-[#92400E] border border-[#FBBF24]/50">
                    HIGH INTENT
                  </span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold text-[#0F0F12]">87</span>
                  <span className="text-xs text-[#64748B]">/ 100</span>
                </div>
                <div className="mt-2 text-[11px] text-[#475569] space-y-1 pt-2 border-t border-[#5C1D3A]/10">
                  <div className="flex justify-between">
                    <span>Timeline:</span>
                    <span className="font-semibold text-[#0F0F12]">1 week</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next Best Action:</span>
                    <span className="font-semibold text-[#5C1D3A]">Schedule Human Meeting</span>
                  </div>
                </div>
              </div>

              {/* Floating Glass Card 2: AI Voice Agent Listening (Mint Waveform) */}
              <div className="animate-subtle-float [animation-delay:1.5s] sm:absolute -bottom-8 -left-4 z-20 mt-4 sm:mt-0 p-3.5 rounded-2xl glass-card border border-[#34D399]/40 shadow-glass-md max-w-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] border border-[#34D399]/40 flex items-center justify-center text-[#065F46]">
                    <Headphones className="w-5 h-5 text-[#34D399] animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0F0F12]">AI Voice SDR</div>
                    <div className="text-[11px] text-[#065F46] font-semibold flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#34D399] animate-ping"></span>
                      <span>Listening... (Gemini Engine)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Glass Card 3: Calendly Meeting Booked */}
              <div className="animate-subtle-float [animation-delay:2.5s] sm:absolute -bottom-6 -right-6 z-20 mt-4 sm:mt-0 p-3.5 rounded-2xl glass-card border border-[#E5C158]/40 shadow-glass-md max-w-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] border border-[#FBBF24]/40 flex items-center justify-center text-[#92400E]">
                    <CalendarCheck className="w-5 h-5 text-[#E5C158]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0F0F12]">Calendly Integration</div>
                    <div className="text-[11px] text-[#92400E] font-semibold">
                      Confirmed Meeting Booked
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PROBLEM SECTION                                              */}
      {/* ============================================================ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-[#5C1D3A]/12">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#F87171] bg-[#FEF2F2] px-3.5 py-1 rounded-full border border-[#F87171]/35">
            The Sales Friction
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F0F12] tracking-tight mt-3">
            Sales teams don't just need more leads.{' '}
            <span className="text-[#5C1D3A]">They need to know what to do next.</span>
          </h2>
          <p className="text-[#475569] text-sm sm:text-base mt-3">
            Inbound forms and raw LinkedIn posts create noise without direction. Without immediate context and autonomous outreach, pipeline leaks at every handoff.
          </p>
        </div>

        {/* 3 Glass Problem Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Problem 01 */}
          <GlassCard variant="hover" className="p-6">
            <div className="text-2xl font-black text-[#F87171] mb-3">01</div>
            <h3 className="text-lg font-bold text-[#0F0F12] tracking-tight mb-2">Too many leads</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Sifting through hundreds of raw posts and unsegmented prospects wastes hours without intent clarity, causing SDR teams to dial without priority.
            </p>
          </GlassCard>

          {/* Problem 02 */}
          <GlassCard variant="hover" className="p-6">
            <div className="text-2xl font-black text-[#FBBF24] mb-3">02</div>
            <h3 className="text-lg font-bold text-[#0F0F12] tracking-tight mb-2">Too little context</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Sales reps dial cold without knowing the buyer's urgency, timeline, or specific budget blockers, resulting in generic pitches and low conversion.
            </p>
          </GlassCard>

          {/* Problem 03 */}
          <GlassCard variant="hover" className="p-6">
            <div className="text-2xl font-black text-[#5C1D3A] mb-3">03</div>
            <h3 className="text-lg font-bold text-[#0F0F12] tracking-tight mb-2">Too much manual follow-up</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              High-intent leads go cold because manual outreach takes days instead of seconds. By the time an SDR calls back, the buyer has already chosen a competitor.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SOLUTION SECTION                                             */}
      {/* ============================================================ */}
      <section id="solutions" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-[#5C1D3A]/12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: Product Explanation */}
          <div className="lg:col-span-6 space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C1D3A] bg-[#F2F0FF] px-3.5 py-1 rounded-full border border-[#5C1D3A]/20">
              The LeadPoint Solution
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F0F12] tracking-tight leading-tight">
              Actionable intelligence before the first hello.
            </h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              LeadPoint-AI connects the dots between raw social intent and a booked meeting. When a prospect mentions a business pain point, our AI determines ICP fit, calculates intent score, and initiates conversational voice outreach with tailored questions.
            </p>

            <div className="space-y-3 pt-2 text-xs text-[#0F0F12]">
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
                <span>Automatic lead deduplication and RFC email validation.</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
                <span>Deep ICP matching based on your organization's value proposition.</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
                <span>Deterministic next-best-action engine based on real buyer signals.</span>
              </div>
            </div>
          </div>

          {/* Right: Glass Orchestration Card */}
          <div className="lg:col-span-6">
            <GlassCard variant="solid" className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#5C1D3A]/12">
                <div>
                  <div className="text-base font-bold text-[#0F0F12]">Sarah Jenkins</div>
                  <div className="text-xs text-[#64748B]">Apex Cloud Solutions · IT Operations</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#065F46] border border-[#34D399]/40">
                  VERIFIED ICP
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-[#E6F0FA] border border-[#5C1D3A]/15">
                  <div className="text-[10px] font-bold uppercase text-[#5C1D3A]">Intent</div>
                  <div className="text-sm font-extrabold text-[#0F0F12] mt-0.5">HIGH</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FEF3C7] border border-[#FBBF24]/40">
                  <div className="text-[10px] font-bold uppercase text-[#92400E]">Urgency</div>
                  <div className="text-sm font-extrabold text-[#92400E] mt-0.5">HIGH</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#E6F0FA] border border-[#5C1D3A]/15">
                  <div className="text-[10px] font-bold uppercase text-[#475569]">Timeline</div>
                  <div className="text-sm font-extrabold text-[#0F0F12] mt-0.5">1 week</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F2F0FF] border border-[#5C1D3A]/18 space-y-1 text-xs">
                <div className="font-bold text-[#0F0F12] flex items-center space-x-1.5">
                  <Target className="w-3.5 h-3.5 text-[#5C1D3A]" />
                  <span>Determined Next Best Action:</span>
                </div>
                <div className="text-[#5C1D3A] font-bold text-sm">
                  Human Meeting (Calendly Dispatch)
                </div>
                <p className="text-[11px] text-[#475569] pt-1">
                  Buyer confirmed decision-making authority and immediate modernization timeline. Direct human handoff triggered.
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* HOW IT WORKS (CONNECTED 8-STAGE JOURNEY)                      */}
      {/* ============================================================ */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-[#5C1D3A]/12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5C1D3A] bg-[#F2F0FF] px-3.5 py-1 rounded-full border border-[#5C1D3A]/20">
            Connected Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F0F12] tracking-tight mt-3">
            The 8-Stage Lead Orchestration Journey
          </h2>
          <p className="text-[#475569] text-sm sm:text-base mt-2">
            From raw signal discovery to confirmed calendar bookings, every stage is fully observable.
          </p>
        </div>

        {/* 8-Stage Timeline Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: '01',
              title: 'Bring Your Leads',
              desc: 'Upload CSV or discover social intent posts matching your target ICP.',
              badgeColor: 'border-[#5C1D3A]/20 bg-[#E6F0FA] text-[#0F0F12]',
            },
            {
              step: '02',
              title: 'AI Understands',
              desc: 'LLM extracts core company pain points, technology stack, and budget cues.',
              badgeColor: 'border-[#5C1D3A]/20 bg-[#F2F0FF] text-[#5C1D3A]',
            },
            {
              step: '03',
              title: 'AI Qualifies',
              desc: 'Calculates intent score (0-100) and matches relevance against your offerings.',
              badgeColor: 'border-[#E5C158]/40 bg-[#FEF3C7] text-[#92400E]',
            },
            {
              step: '04',
              title: 'AI Engages',
              desc: 'Autonomous Voice SDR initiates conversational outreach with localized tone.',
              badgeColor: 'border-[#34D399]/40 bg-[#ECFDF5] text-[#065F46]',
            },
            {
              step: '05',
              title: 'Intent Detected',
              desc: 'Natural language analysis catches buying readiness, timelines, and decision authority.',
              badgeColor: 'border-[#34D399]/40 bg-[#ECFDF5] text-[#065F46]',
            },
            {
              step: '06',
              title: 'Next Best Action',
              desc: 'System decides between automated follow-up, nurture sequence, or immediate handoff.',
              badgeColor: 'border-[#FBBF24]/40 bg-[#FEF3C7] text-[#92400E]',
            },
            {
              step: '07',
              title: 'Human Handoff',
              desc: 'Autonomous SDR triggers SMS or email with your AE’s calendar link.',
              badgeColor: 'border-[#E5C158]/40 bg-[#FEF3C7] text-[#92400E]',
            },
            {
              step: '08',
              title: 'Meeting Booked',
              desc: 'Meeting registered on Calendly, syncs back to your CRM with full audio transcript.',
              badgeColor: 'border-[#34D399]/40 bg-[#ECFDF5] text-[#065F46]',
            },
          ].map((stage, idx) => (
            <GlassCard
              key={stage.step}
              variant="hover"
              className="p-5 space-y-2 relative"
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded-full border ${stage.badgeColor}`}>
                  Stage {stage.step}
                </span>
                <span className="text-[#64748B] text-xs font-bold">0{idx + 1}/08</span>
              </div>
              <h3 className="text-sm font-bold text-[#0F0F12] tracking-tight pt-1">{stage.title}</h3>
              <p className="text-xs text-[#475569] leading-relaxed">{stage.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* AI LEAD INTELLIGENCE SHOWCASE                                */}
      {/* ============================================================ */}
      <section id="intelligence" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-[#5C1D3A]/12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: Heading & Bullets */}
          <div className="lg:col-span-5 space-y-5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C1D3A] bg-[#F2F0FF] px-3.5 py-1 rounded-full border border-[#5C1D3A]/20">
              Deep Intent Analysis
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F0F12] tracking-tight leading-tight">
              Know what your lead needs before your sales team steps in.
            </h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              Every lead undergoes multi-dimensional evaluation. Rather than relying on guesswork, our engine correlates technical urgency, organizational size, and active migration signals.
            </p>

            <div className="space-y-2 text-xs font-medium text-[#0F0F12]">
              <div className="p-3 rounded-xl bg-[#E6F0FA]/80 border border-[#5C1D3A]/15 flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-[#E5C158]"></div>
                <span>Timeline Urgency & Target Go-Live Dates</span>
              </div>
              <div className="p-3 rounded-xl bg-[#E6F0FA]/80 border border-[#5C1D3A]/15 flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-[#5C1D3A]"></div>
                <span>Decision-Maker Authority & Implementation Team Size</span>
              </div>
              <div className="p-3 rounded-xl bg-[#E6F0FA]/80 border border-[#5C1D3A]/15 flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-[#34D399]"></div>
                <span>Direct ICP Alignment with Your Firm's Core Offering</span>
              </div>
            </div>
          </div>

          {/* Right: Glass Assessment Mockup with Interactive Factors */}
          <div className="lg:col-span-7">
            <GlassCard variant="solid" className="p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#5C1D3A]/12">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[#E5C158]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0F0F12]">
                    Lead Intelligence Assessment
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#64748B]">ID: lead_apex_982</span>
              </div>

              {/* Factors Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'timeline', label: 'Timeline', val: '1 week', urgency: 'High' },
                  { id: 'intent', label: 'Intent Score', val: '87 / 100', urgency: 'High Intent' },
                  { id: 'budget', label: 'Budget Status', val: 'Q4 Approved', urgency: 'Verified' },
                  { id: 'icp', label: 'ICP Match', val: 'Cloud Infra', urgency: 'Exact' },
                  { id: 'authority', label: 'Authority', val: 'VP Ops', urgency: 'Signer' },
                  { id: 'action', label: 'Next Action', val: 'Human Handoff', urgency: 'Immediate' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedFactor(item.id)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      selectedFactor === item.id
                        ? 'bg-[#F2F0FF] border-[#5C1D3A]/40 shadow-glass-sm ring-1 ring-[#5C1D3A]/30'
                        : 'bg-[#E6F0FA]/80 border-[#5C1D3A]/15 hover:border-[#5C1D3A]/30'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                      {item.label}
                    </div>
                    <div className="text-xs font-extrabold text-[#0F0F12] mt-0.5">{item.val}</div>
                    <div className="text-[10px] font-semibold text-[#5C1D3A] mt-1">{item.urgency}</div>
                  </button>
                ))}
              </div>

              {/* "Why this recommendation?" Interactive Explanation */}
              <div className="p-4 rounded-xl bg-[#F2F0FF]/90 border border-[#5C1D3A]/15 text-xs space-y-1.5">
                <div className="font-bold text-[#0F0F12] flex items-center space-x-1.5">
                  <Bot className="w-4 h-4 text-[#5C1D3A]" />
                  <span>Why this recommendation?</span>
                </div>
                {selectedFactor === 'timeline' && (
                  <p className="text-[#475569] text-[11px] leading-relaxed">
                    Prospect explicitly confirmed: "We need migration completed within one week." This triggers immediate prioritization over standard 30-day nurture cycles.
                  </p>
                )}
                {selectedFactor === 'intent' && (
                  <p className="text-[#475569] text-[11px] leading-relaxed">
                    Weighted 87/100 based on three concurrent triggers: direct public request for implementation partner, executive seniority, and zero objection responses during voice call.
                  </p>
                )}
                {selectedFactor === 'budget' && (
                  <p className="text-[#475569] text-[11px] leading-relaxed">
                    Budget has been pre-allocated under Q4 infrastructure modernization initiative. No procurement delays expected.
                  </p>
                )}
                {selectedFactor === 'icp' && (
                  <p className="text-[#475569] text-[11px] leading-relaxed">
                    Exact fit for enterprise cloud consulting services. Company size 50-200 employees with hybrid SharePoint infrastructure.
                  </p>
                )}
                {selectedFactor === 'authority' && (
                  <p className="text-[#475569] text-[11px] leading-relaxed">
                    Lead holds VP IT Operations title with direct signing authority for cloud modernizations and vendor onboarding.
                  </p>
                )}
                {selectedFactor === 'action' && (
                  <p className="text-[#475569] text-[11px] leading-relaxed">
                    The deterministic Next-Best-Action engine routed this lead away from automated nurture and directly into immediate human meeting scheduling.
                  </p>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* AI VOICE SECTION                                             */}
      {/* ============================================================ */}
      <section id="voice-sdr" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-[#5C1D3A]/12">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#065F46] bg-[#ECFDF5] px-3.5 py-1 rounded-full border border-[#34D399]/40">
            Autonomous Voice Telephony
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F0F12] tracking-tight mt-3">
            Real Multi-Turn Voice Qualification
          </h2>
          <p className="text-[#475569] text-sm sm:text-base mt-2">
            Our Voice SDR uses dynamic progression rather than static scripts, extracting timelines and intent in under 60 seconds.
          </p>
        </div>

        {/* Full-width Product Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Large Voice Agent Interface */}
          <GlassCard variant="solid" className="lg:col-span-5 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#5C1D3A]/12">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#34D399] animate-pulse"></div>
                  <span className="text-xs font-bold uppercase text-[#0F0F12]">Call Connected</span>
                </div>
                <span className="text-xs font-mono text-[#64748B]">01:42</span>
              </div>

              {/* Waveform Visualization (Neon Mint #34D399) */}
              <div className="py-8 flex items-center justify-center space-x-1.5">
                {[12, 28, 44, 20, 36, 48, 24, 16, 40, 52, 30, 18, 42, 22].map((height, i) => (
                  <span
                    key={i}
                    style={{ height: `${height}px` }}
                    className="w-1.5 rounded-full bg-[#34D399] animate-waveform"
                  />
                ))}
              </div>

              <div className="text-center space-y-1">
                <div className="text-sm font-bold text-[#0F0F12]">Alex Carter (Voice SDR)</div>
                <div className="text-xs text-[#64748B]">Engaging Sarah Jenkins · Apex Cloud Systems</div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#5C1D3A]/12 flex items-center justify-around text-xs">
              <span className="text-[#64748B]">Latency: <span className="font-bold text-[#0F0F12]">Sub-second</span></span>
              <span className="text-[#5C1D3A]/20">|</span>
              <span className="text-[#64748B]">Provider: <span className="font-bold text-[#0F0F12]">Twilio SIP</span></span>
              <span className="text-[#5C1D3A]/20">|</span>
              <span className="text-[#64748B]">Engine: <span className="font-bold text-[#5C1D3A]">Gemini Pro</span></span>
            </div>
          </GlassCard>

          {/* Right: Realistic Transcript & Intent Detection */}
          <GlassCard variant="solid" className="lg:col-span-7 p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Live Conversation Stream
              </div>

              {/* Chat Turn 1 */}
              <div className="p-3.5 rounded-xl bg-[#F2F0FF] border border-[#5C1D3A]/15 space-y-1">
                <div className="text-[10px] font-bold uppercase text-[#5C1D3A]">LeadPoint AI SDR</div>
                <p className="text-xs text-[#0F0F12]">
                  "Hi Sarah, thanks for taking my call! I noticed Apex Cloud Systems is evaluating SharePoint Online migration partners. What is your target completion timeline?"
                </p>
              </div>

              {/* Chat Turn 2 */}
              <div className="p-3.5 rounded-xl bg-[#E6F0FA] border border-[#5C1D3A]/18 space-y-1 ml-4">
                <div className="text-[10px] font-bold uppercase text-[#64748B]">Prospect (Sarah Jenkins)</div>
                <p className="text-xs text-[#0F0F12] font-medium">
                  "We have an upcoming contract renewal with our hosting provider. We really need this wrapped up within one week."
                </p>
              </div>

              {/* Chat Turn 3 */}
              <div className="p-3.5 rounded-xl bg-[#F2F0FF] border border-[#5C1D3A]/15 space-y-1">
                <div className="text-[10px] font-bold uppercase text-[#5C1D3A]">LeadPoint AI SDR</div>
                <p className="text-xs text-[#0F0F12]">
                  "Understood. One week is tight, but our cloud architect can review your tenant topology immediately. Would you like me to send our Calendly link right now?"
                </p>
              </div>
            </div>

            {/* Intent Detected Alert */}
            <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#34D399]/40 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                <span className="font-bold text-[#065F46]">Intent Detected: HIGH</span>
              </div>
              <span className="text-[11px] font-semibold text-[#065F46]">
                Triggered Next-Best-Action &rarr; Human Handoff
              </span>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ============================================================ */}
      {/* HUMAN HANDOFF                                                */}
      {/* ============================================================ */}
      <section id="handoff" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-[#5C1D3A]/12">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#92400E] bg-[#FEF3C7] px-3.5 py-1 rounded-full border border-[#FBBF24]/40">
            Seamless Sales Handoff
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F0F12] tracking-tight mt-3">
            Know when AI should step aside.
          </h2>
          <p className="text-[#475569] text-sm sm:text-base mt-2">
            Automation should never get in the way of a closing conversation. LeadPoint-AI hands high-intent buyers directly to your account executives with zero friction.
          </p>
        </div>

        {/* Visual Flow: AI (Violet/Ice Blue) -> Human Intent (Gold) -> Calendly (Warm) -> SMS (Peach) -> Booked (Mint) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <GlassCard variant="hover" className="p-4 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#E6F0FA] text-[#5C1D3A] border border-[#5C1D3A]/20 mx-auto flex items-center justify-center font-bold text-xs">
              01
            </div>
            <div className="text-xs font-bold text-[#0F0F12]">AI Conversation</div>
            <div className="text-[11px] text-[#64748B]">Multi-turn voice qualification</div>
          </GlassCard>

          <GlassCard variant="hover" className="p-4 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FBBF24]/40 mx-auto flex items-center justify-center font-bold text-xs">
              02
            </div>
            <div className="text-xs font-bold text-[#0F0F12]">Human Intent</div>
            <div className="text-[11px] text-[#92400E]">Buyer requests meeting</div>
          </GlassCard>

          <GlassCard variant="hover" className="p-4 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FBBF24]/40 mx-auto flex items-center justify-center font-bold text-xs">
              03
            </div>
            <div className="text-xs font-bold text-[#0F0F12]">Calendly Link</div>
            <div className="text-[11px] text-[#92400E]">Real-time slot matching</div>
          </GlassCard>

          <GlassCard variant="hover" className="p-4 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#FEF2F2] text-[#F87171] border border-[#F87171]/40 mx-auto flex items-center justify-center font-bold text-xs">
              04
            </div>
            <div className="text-xs font-bold text-[#0F0F12]">Instant SMS</div>
            <div className="text-[11px] text-[#64748B]">Direct link to buyer phone</div>
          </GlassCard>

          <GlassCard variant="hover" className="p-4 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#34D399]/40 mx-auto flex items-center justify-center font-bold text-xs">
              05
            </div>
            <div className="text-xs font-bold text-[#065F46]">Meeting Booked</div>
            <div className="text-[11px] text-[#065F46]">Calendar slot locked</div>
          </GlassCard>
        </div>
      </section>

      {/* ============================================================ */}
      {/* LEAD LIFECYCLE (GLASS TIMELINE)                              */}
      {/* ============================================================ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-[#5C1D3A]/12">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] bg-[#E6F0FA] px-3.5 py-1 rounded-full border border-[#5C1D3A]/15">
            Pipeline Transparency
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F0F12] tracking-tight mt-3">
            Full Lead Lifecycle Visibility
          </h2>
          <p className="text-[#475569] text-sm sm:text-base mt-2">
            Every prospect progresses through clear semantic milestones without manual spreadsheets.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { status: 'NEW', color: 'bg-[#E6F0FA] text-[#0F0F12] border-[#5C1D3A]/20', desc: 'Ingested lead' },
            { status: 'QUALIFIED', color: 'bg-[#F3E8FF] text-[#6B21A8] border-[#C084FC]/40', desc: 'Score >= 70' },
            { status: 'INTERESTED', color: 'bg-[#ECFDF5] text-[#065F46] border-[#34D399]/40', desc: 'Positive reply' },
            { status: 'CALENDLY SENT', color: 'bg-[#FEF3C7] text-[#92400E] border-[#FBBF24]/40', desc: 'SMS dispatched' },
            { status: 'BOOKED', color: 'bg-[#ECFDF5] text-[#065F46] border-[#34D399]/40', desc: 'Meeting confirmed' },
            { status: 'FOLLOW-UP', color: 'bg-[#FEF2F2] text-[#F87171] border-[#F87171]/40', desc: 'Nurture reminder' },
          ].map((item) => (
            <GlassCard
              key={item.status}
              variant="hover"
              className="p-4 text-center space-y-1"
            >
              <span className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${item.color}`}>
                {item.status}
              </span>
              <div className="text-[11px] text-[#64748B] font-medium pt-1">{item.desc}</div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* ASYMMETRIC BENTO FEATURE GRID                                */}
      {/* ============================================================ */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-[#5C1D3A]/12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5C1D3A] bg-[#F2F0FF] px-3.5 py-1 rounded-full border border-[#5C1D3A]/20">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F0F12] tracking-tight mt-3">
            Engineered for High-Velocity B2B Sales
          </h2>
          <p className="text-[#475569] text-sm sm:text-base mt-2">
            A comprehensive suite designed to replace fractured tools with a single orchestration layer.
          </p>
        </div>

        {/* Bento Grid: Varied Card Sizes and Hierarchy */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Card 1: Large Span 2 */}
          <GlassCard variant="hover" className="md:col-span-2 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F0F12] border border-[#E5C158]/40 text-[#F6E27A] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#F6E27A]" />
            </div>
            <h3 className="text-base font-bold text-[#0F0F12]">AI Lead Intelligence</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Analyzes raw business descriptions, extracts verified value propositions, and scores intent using fine-tuned Gemini models with deterministic relevance metrics.
            </p>
          </GlassCard>

          {/* Card 2 */}
          <GlassCard variant="hover" className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F0FA] border border-[#5C1D3A]/15 text-[#5C1D3A] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-[#5C1D3A]" />
            </div>
            <h3 className="text-base font-bold text-[#0F0F12]">CSV Lead Import</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              RFC-compliant email validation, automatic deduplication, and bulk tenant scoping in seconds.
            </p>
          </GlassCard>

          {/* Card 3 */}
          <GlassCard variant="hover" className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#34D399]/40 text-[#065F46] flex items-center justify-center">
              <Headphones className="w-5 h-5 text-[#34D399]" />
            </div>
            <h3 className="text-base font-bold text-[#0F0F12]">AI Voice Outreach</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Sub-second conversational telephony via Twilio SIP and Gemini with responsive objection handling.
            </p>
          </GlassCard>

          {/* Card 4 */}
          <GlassCard variant="hover" className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] border border-[#FBBF24]/40 text-[#92400E] flex items-center justify-center">
              <Target className="w-5 h-5 text-[#E5C158]" />
            </div>
            <h3 className="text-base font-bold text-[#0F0F12]">Intent Detection</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Extracts target timelines, implementation scale, and budget cues during active calls.
            </p>
          </GlassCard>

          {/* Card 5: Large Span 2 */}
          <GlassCard variant="hover" className="md:col-span-2 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] border border-[#FBBF24]/40 text-[#92400E] flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-[#E5C158]" />
            </div>
            <h3 className="text-base font-bold text-[#0F0F12]">Human Handoff & Calendly</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Recognizes when a buyer wants to talk to a human specialist, automatically generating and dispatching Calendly booking links via SMS.
            </p>
          </GlassCard>

          {/* Card 6 */}
          <GlassCard variant="hover" className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F0FA] border border-[#5C1D3A]/15 text-[#5C1D3A] flex items-center justify-center">
              <Layers className="w-5 h-5 text-[#5C1D3A]" />
            </div>
            <h3 className="text-base font-bold text-[#0F0F12]">Campaigns</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Schedule, launch, pause, and monitor outbound outreach sequences across customer cohorts.
            </p>
          </GlassCard>

          {/* Card 7 */}
          <GlassCard variant="hover" className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F0FA] border border-[#5C1D3A]/15 text-[#5C1D3A] flex items-center justify-center">
              <Globe className="w-5 h-5 text-[#5C1D3A]" />
            </div>
            <h3 className="text-base font-bold text-[#0F0F12]">Multilingual Voice</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Full conversational SDR support in English, German, Spanish, French, and Hindi.
            </p>
          </GlassCard>

          {/* Card 8 */}
          <GlassCard variant="hover" className="p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#F2F0FF] border border-[#5C1D3A]/15 text-[#0F0F12] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#5C1D3A]" />
            </div>
            <h3 className="text-base font-bold text-[#0F0F12]">Tenant Isolation & RBAC</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Zero cross-tenant data leaks with role-based access for ADMIN, SDR, and CLIENT accounts.
            </p>
          </GlassCard>

          {/* Card 9: Span 2 */}
          <GlassCard variant="hover" className="md:col-span-2 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F0F12] border border-[#E5C158]/40 text-[#F6E27A] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#F6E27A]" />
            </div>
            <h3 className="text-base font-bold text-[#0F0F12]">Telemetry & Analytics</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              Real-time pipeline analytics, conversation outcome charts, and telephony quota meters to track team productivity.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* ============================================================ */}
      {/* USP SECTION (DEEP CHARCOAL #0F0F12 WITH GOLD TYPOGRAPHY)     */}
      {/* ============================================================ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0F0F12] text-white w-full relative overflow-hidden border-y border-[#5C1D3A]/30">
        <div className="max-w-6xl mx-auto text-center space-y-8 relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#F6E27A] bg-slate-900 border border-[#E5C158]/40 px-3.5 py-1.5 rounded-full shadow-xs">
            Our Architectural Edge
          </span>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight">
            We don't just automate the conversation.{' '}
            <span className="text-gold-gradient block mt-1">We automate what happens next.</span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Generic AI callers stop when the call disconnects. LeadPoint-AI executes the entire downstream sales cycle: intent classification, calendar scheduling, SMS dispatch, and CRM sync.
          </p>

          {/* Visual Progression: Lead -> Understand -> Qualify -> Decide -> Act -> Convert */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Lead', sub: 'Signal Ingestion', color: 'border-[#5C1D3A]/40 text-slate-300' },
              { label: 'Understand', sub: 'ICP Extraction', color: 'border-[#5C1D3A]/50 text-[#F6E27A]' },
              { label: 'Qualify', sub: 'Voice SDR Turn', color: 'border-[#E5C158]/40 text-[#F6E27A]' },
              { label: 'Decide', sub: 'Intent Detection', color: 'border-[#34D399]/40 text-[#34D399]' },
              { label: 'Act', sub: 'Human Handoff', color: 'border-[#FBBF24]/40 text-[#FBBF24]' },
              { label: 'Convert', sub: 'Meeting Booked', color: 'border-[#34D399]/50 text-[#34D399]' },
            ].map((step, idx) => (
              <div
                key={step.label}
                className={`p-4 rounded-2xl bg-slate-900/90 border ${step.color} text-center space-y-1 shadow-glass-sm`}
              >
                <div className="text-[10px] font-mono text-[#E5C158] font-bold">0{idx + 1}</div>
                <div className="text-sm font-extrabold text-white">{step.label}</div>
                <div className="text-[11px] text-slate-400">{step.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FINAL CTA SECTION                                            */}
      {/* ============================================================ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <GlassCard variant="solid" className="p-8 sm:p-14 shadow-glass-lg text-center space-y-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5C1D3A] bg-[#F2F0FF] px-3.5 py-1 rounded-full border border-[#5C1D3A]/20">
            Ready to Accelerate?
          </span>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F0F12] tracking-tight max-w-xl mx-auto">
            Turn your next lead into your next opportunity.
          </h2>

          <p className="text-[#475569] text-sm max-w-lg mx-auto">
            Deploy autonomous voice SDR agents, qualify inbound buyer signals, and streamline calendar bookings in minutes.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/${locale}/register`}
              className="btn-primary-black w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm"
            >
              <span>Get Started</span>
              <ChevronRight className="w-4 h-4 ml-1 text-[#F6E27A]" />
            </Link>
            <Link
              href={`/${locale}/login`}
              className="btn-secondary-glass w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm"
            >
              Explore Platform
            </Link>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
