'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  Users,
  Target,
  CheckCircle2,
  CalendarCheck,
  ArrowUpRight,
  PhoneCall,
  Sparkles,
  Clock,
  AlertCircle,
  Layers,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Bot,
  Building2,
  Calendar,
} from 'lucide-react';

interface MetricState {
  totalLeads: number;
  highIntentCount: number;
  qualifiedCount: number;
  meetingsBookedCount: number;
  recentLeads: any[];
  followUpLeads: any[];
  bookedLeads: any[];
  pipeline: {
    newCount: number;
    contactedCount: number;
    qualifiedCount: number;
    interestedCount: number;
    bookedCount: number;
  };
}

export default function DashboardPage() {
  const locale = useLocale();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MetricState>({
    totalLeads: 0,
    highIntentCount: 0,
    qualifiedCount: 0,
    meetingsBookedCount: 0,
    recentLeads: [],
    followUpLeads: [],
    bookedLeads: [],
    pipeline: {
      newCount: 0,
      contactedCount: 0,
      qualifiedCount: 0,
      interestedCount: 0,
      bookedCount: 0,
    },
  });

  useEffect(() => {
    let mounted = true;

    async function fetchDashboardData() {
      try {
        const [meRes, analyticsRes] = await Promise.all([
          fetch('/api/auth/me').then((r) => r.json()).catch(() => ({ success: false })),
          fetch('/api/analytics').then((r) => r.json()).catch(() => ({ success: false })),
        ]);

        if (!mounted) return;

        if (meRes.success && meRes.data?.user) {
          setUser({
            ...meRes.data.user,
            companyName: meRes.data.companyProfile?.name || 'CloudScale Consulting',
          });
        }

        if (analyticsRes.success && analyticsRes.data) {
          const leads: any[] = analyticsRes.data.leads || [];

          const highIntent = leads.filter(
            (l) => (l.score && l.score >= 75) || l.status === 'QUALIFIED' || l.status === 'INTERESTED'
          );
          const qualified = leads.filter((l) => l.status === 'QUALIFIED');
          const booked = leads.filter((l) => l.status === 'BOOKED');
          const followUps = leads.filter((l) => l.status === 'CONTACTED' || l.status === 'INTERESTED');

          const newCount = leads.filter((l) => l.status === 'NEW').length;
          const contactedCount = leads.filter((l) => l.status === 'CONTACTED').length;
          const qualifiedCount = qualified.length;
          const interestedCount = leads.filter((l) => l.status === 'INTERESTED').length;
          const bookedCount = booked.length;

          setData({
            totalLeads: leads.length,
            highIntentCount: highIntent.length,
            qualifiedCount,
            meetingsBookedCount: bookedCount,
            recentLeads: leads.slice(0, 5),
            followUpLeads: followUps.slice(0, 3),
            bookedLeads: booked.slice(0, 3),
            pipeline: {
              newCount,
              contactedCount,
              qualifiedCount,
              interestedCount,
              bookedCount,
            },
          });
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchDashboardData();
    return () => {
      mounted = false;
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const currentDateFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  if (loading) {
    return (
      <div className="p-16 text-center text-[#64748B] glass-card-solid border border-[#5C1D3A]/18 rounded-2xl max-w-4xl mx-auto shadow-glass-md">
        <RefreshCw className="h-7 w-7 animate-spin mx-auto text-[#5C1D3A] mb-3" />
        <p className="text-sm font-bold text-[#0F0F12]">Loading Sales Intelligence Dashboard...</p>
        <p className="text-xs text-[#64748B] mt-1">Aggregating real-time leads, pipeline, and voice telemetry</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* TOP HEADER: Greeting, Company, Date                           */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#5C1D3A]/12">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0F0F12]">
            {getGreeting()}, {user?.name || 'Sales Director'}
          </h1>
          <div className="flex items-center space-x-2 text-xs text-[#64748B] mt-1">
            <span className="font-semibold text-[#0F0F12]">{user?.companyName}</span>
            <span>•</span>
            <span>{currentDateFormatted}</span>
            <span>•</span>
            <span className="text-[#065F46] font-semibold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse"></span>
              <span>Telemetry Connected</span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            href={`/${locale}/leads`}
            className="btn-secondary-glass py-2 px-3.5 text-xs font-semibold"
          >
            <Users className="w-3.5 h-3.5 mr-1.5 text-[#64748B]" />
            <span>Manage Leads</span>
          </Link>
          <Link
            href={`/${locale}/voice`}
            className="btn-primary-black py-2 px-4 text-xs font-semibold shadow-xs"
          >
            <PhoneCall className="w-3.5 h-3.5 mr-1.5 text-[#F6E27A]" />
            <span>Launch Voice SDR</span>
          </Link>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4 COMPACT KPI CARDS                                           */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads (Ice Blue Glass) */}
        <div className="p-4 rounded-2xl glass-card border border-[#5C1D3A]/15 shadow-glass-sm hover-elevate space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#0F0F12]">
            <span>Total Ingested Leads</span>
            <Users className="w-4 h-4 text-[#5C1D3A]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-[#0F0F12]">{data.totalLeads}</span>
            <span className="text-xs text-[#64748B] font-medium">in database</span>
          </div>
          <div className="text-[11px] text-[#475569] font-medium flex items-center space-x-1 pt-1 border-t border-[#5C1D3A]/10">
            <CheckCircle2 className="w-3 h-3 text-[#34D399]" />
            <span>Tenant-isolated records</span>
          </div>
        </div>

        {/* High Intent (Violet / Magenta) */}
        <div className="p-4 rounded-2xl glass-card border border-[#5C1D3A]/20 shadow-glass-sm hover-elevate space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#5C1D3A]">
            <span>High Intent Leads</span>
            <Sparkles className="w-4 h-4 text-[#E5C158]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-[#0F0F12]">{data.highIntentCount}</span>
            <span className="text-xs text-[#64748B] font-medium">score &ge; 75</span>
          </div>
          <div className="text-[11px] text-[#5C1D3A] font-medium flex items-center space-x-1 pt-1 border-t border-[#5C1D3A]/10">
            <TrendingUp className="w-3 h-3 text-[#E5C158]" />
            <span>Priority action ready</span>
          </div>
        </div>

        {/* Qualified (Mint Green #34D399) */}
        <div className="p-4 rounded-2xl glass-card border border-[#34D399]/35 shadow-glass-sm hover-elevate space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#065F46]">
            <span>Qualified Prospects</span>
            <Target className="w-4 h-4 text-[#34D399]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-[#0F0F12]">{data.qualifiedCount}</span>
            <span className="text-xs text-[#64748B] font-medium">verified ICP</span>
          </div>
          <div className="text-[11px] text-[#065F46] font-medium flex items-center space-x-1 pt-1 border-t border-[#34D399]/20">
            <CheckCircle2 className="w-3 h-3 text-[#34D399]" />
            <span>Multi-turn verified</span>
          </div>
        </div>

        {/* Meetings Booked (Gold / Amber) */}
        <div className="p-4 rounded-2xl glass-card border border-[#E5C158]/40 shadow-glass-sm hover-elevate space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#92400E]">
            <span>Meetings Booked</span>
            <CalendarCheck className="w-4 h-4 text-[#E5C158]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-[#0F0F12]">{data.meetingsBookedCount}</span>
            <span className="text-xs text-[#64748B] font-medium">on Calendly</span>
          </div>
          <div className="text-[11px] text-[#92400E] font-medium flex items-center space-x-1 pt-1 border-t border-[#E5C158]/20">
            <Calendar className="w-3 h-3 text-[#E5C158]" />
            <span>Calendar link dispatched</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CENTRAL LEAD PIPELINE                                         */}
      {/* ============================================================ */}
      <div className="p-5 rounded-2xl glass-card-solid border border-[#5C1D3A]/18 shadow-glass-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#0F0F12] tracking-tight">Lead Pipeline Distribution</h2>
            <p className="text-xs text-[#64748B]">Live breakdown of active prospects across qualification stages</p>
          </div>
          <Link
            href={`/${locale}/analytics`}
            className="text-xs font-semibold text-[#5C1D3A] hover:underline flex items-center space-x-1"
          >
            <span>View Full Analytics</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Horizontal Progress Pipeline Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-[#E6F0FA]/80 border border-[#5C1D3A]/15">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#0F0F12]">New</div>
            <div className="text-lg font-bold text-[#0F0F12] mt-1">{data.pipeline.newCount}</div>
            <div className="text-[10px] text-[#64748B]">Awaiting outreach</div>
          </div>

          <div className="p-3 rounded-xl bg-[#FEF3C7]/70 border border-[#FBBF24]/40">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#92400E]">Contacted</div>
            <div className="text-lg font-bold text-[#0F0F12] mt-1">{data.pipeline.contactedCount}</div>
            <div className="text-[10px] text-[#64748B]">Dialed / in-progress</div>
          </div>

          <div className="p-3 rounded-xl bg-[#F3E8FF]/70 border border-[#C084FC]/40">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B21A8]">Qualified</div>
            <div className="text-lg font-bold text-[#0F0F12] mt-1">{data.pipeline.qualifiedCount}</div>
            <div className="text-[10px] text-[#64748B]">ICP validated</div>
          </div>

          <div className="p-3 rounded-xl bg-[#ECFDF5]/70 border border-[#34D399]/40">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#065F46]">Interested</div>
            <div className="text-lg font-bold text-[#0F0F12] mt-1">{data.pipeline.interestedCount}</div>
            <div className="text-[10px] text-[#64748B]">Positive signal</div>
          </div>

          <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#34D399]/50">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#065F46]">Booked</div>
            <div className="text-lg font-bold text-[#0F0F12] mt-1">{data.pipeline.bookedCount}</div>
            <div className="text-[10px] text-[#64748B]">Meeting locked</div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2-COLUMN SECTION: Recent Activity + AI Recommendations        */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Lead Activity */}
        <div className="lg:col-span-7 p-5 rounded-2xl glass-card-solid border border-[#5C1D3A]/18 shadow-glass-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0F0F12] tracking-tight">Recent Lead Activity</h2>
            <Link
              href={`/${locale}/leads`}
              className="text-xs font-semibold text-[#5C1D3A] hover:underline"
            >
              View all leads &rarr;
            </Link>
          </div>

          {data.recentLeads.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B] border border-dashed border-[#5C1D3A]/20 rounded-xl bg-[#E6F0FA]/40">
              No leads recorded yet. Import CSV leads or run social discovery.
            </div>
          ) : (
            <div className="divide-y divide-[#5C1D3A]/10">
              {data.recentLeads.map((lead) => (
                <div key={lead.id} className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-[#F2F0FF]/50 px-2 rounded-xl transition">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#0F0F12] border border-[#E5C158]/30 text-[#F6E27A] font-bold flex items-center justify-center shrink-0">
                      {lead.name ? lead.name.charAt(0).toUpperCase() : 'L'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-[#0F0F12] truncate">{lead.name || 'Unnamed Prospect'}</div>
                      <div className="text-[#64748B] text-[11px] truncate">{lead.company || lead.industry || 'B2B Client'}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        lead.status === 'QUALIFIED'
                          ? 'bg-[#F3E8FF] text-[#6B21A8] border border-[#C084FC]/40'
                          : lead.status === 'BOOKED'
                          ? 'bg-[#ECFDF5] text-[#065F46] border border-[#34D399]/40'
                          : lead.status === 'CONTACTED'
                          ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FBBF24]/40'
                          : 'bg-[#E6F0FA] text-[#0F0F12] border border-[#5C1D3A]/20'
                      }`}
                    >
                      {lead.status}
                    </span>
                    <Link
                      href={`/${locale}/voice?leadId=${lead.id}`}
                      className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F0F12] hover:bg-[#E6F0FA] transition"
                      title="Launch Call"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: AI Recommendations & Upcoming Meetings */}
        <div className="lg:col-span-5 space-y-4">
          {/* AI Recommendations Card */}
          <div className="p-5 rounded-2xl glass-card border border-[#5C1D3A]/20 shadow-glass-sm space-y-3">
            <div className="flex items-center space-x-2 text-[#5C1D3A] text-xs font-bold uppercase tracking-wider">
              <Bot className="w-4 h-4 text-[#5C1D3A]" />
              <span>AI Action Recommendations</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[#FEF3C7]/80 border border-[#FBBF24]/40 text-[#92400E] space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#E5C158]" />
                  <span>{data.followUpLeads.length} leads require follow-up attention</span>
                </div>
                <p className="text-[11px] text-[#92400E] leading-normal">
                  Prospects engaged in initial conversation but pending calendar reservation.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#F3E8FF]/80 border border-[#C084FC]/40 text-[#6B21A8] space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C084FC]" />
                  <span>{data.highIntentCount} high-intent leads ready for Voice SDR</span>
                </div>
                <p className="text-[11px] text-[#6B21A8] leading-normal">
                  Identified buying triggers match your primary enterprise consulting offerings.
                </p>
              </div>
            </div>
          </div>

          {/* Upcoming Meetings Card */}
          <div className="p-5 rounded-2xl glass-card-solid border border-[#5C1D3A]/18 shadow-glass-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#0F0F12] text-xs font-bold uppercase tracking-wider">
                <CalendarCheck className="w-4 h-4 text-[#34D399]" />
                <span>Confirmed Meetings</span>
              </div>
              <span className="text-[11px] font-semibold text-[#065F46] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#34D399]/40">
                Calendly Sync
              </span>
            </div>

            {data.bookedLeads.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#64748B] border border-[#5C1D3A]/15 rounded-xl bg-[#E6F0FA]/40">
                No meetings booked yet. Dispatch Calendly links during SDR voice calls.
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {data.bookedLeads.map((m) => (
                  <div key={m.id} className="p-2.5 rounded-xl bg-[#ECFDF5]/70 border border-[#34D399]/30 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#0F0F12]">{m.name}</div>
                      <div className="text-[11px] text-[#64748B]">{m.company || 'Enterprise Account'}</div>
                    </div>
                    <span className="text-[10px] font-bold text-[#065F46] bg-[#ECFDF5] border border-[#34D399]/40 px-2 py-0.5 rounded-full">
                      Booked
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
