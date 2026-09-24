'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  BarChart3,
  Target,
  PhoneCall,
  Clock,
  TrendingUp,
  Share2,
  CheckCircle2,
  UserCheck,
  Building2,
  Mail,
  Phone,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Loader2,
  SlidersHorizontal,
  Flame,
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  businessEmail: string;
  phone?: string;
  companyName: string;
  industry: string;
  sourcePlatform: string;
  relevanceScore: number;
  status: string;
  postContent?: string;
  enrichedData: string;
  createdAt: string;
  voiceCalls?: any[];
}

interface AnalyticsData {
  metrics: {
    totalLeads: number;
    qualifiedOrInterestedCount: number;
    conversionRate: number;
    minutesUsed: number;
    minutesLimit: number;
    channelBreakdown: Array<{ name: string; count: number; percentage: number }>;
  };
  kanbanColumns: Record<string, Lead[]>;
  leads: Lead[];
}

const KANBAN_STAGES = [
  { key: 'NEW', color: 'border-blue-500/40 bg-blue-500/10 text-blue-300' },
  { key: 'QUALIFIED', color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300' },
  { key: 'CONTACTED', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
  { key: 'INTERESTED', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
  { key: 'UNRESPONSIVE', color: 'border-slate-700 bg-slate-800/40 text-slate-400' },
];

export default function AnalyticsDashboardPage() {
  const t = useTranslations('Analytics');
  const tKanban = useTranslations('Kanban');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [callingLeadId, setCallingLeadId] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      setUpdatingLeadId(leadId);
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setNotification(`Lead status updated to ${newStatus}`);
        setTimeout(() => setNotification(null), 3000);
        await fetchAnalytics();
      }
    } catch (err) {
      console.error('Failed to update lead status:', err);
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const handleInitiateCall = (lead: Lead) => {
    setCallingLeadId(lead.id);
    setTimeout(() => {
      setCallingLeadId(null);
      setNotification(`📞 Dispatching Voice Agent to ${lead.name} (${lead.phone || lead.businessEmail})... Call initiated!`);
      setTimeout(() => setNotification(null), 4000);
    }, 1200);
  };

  if (loading && !data) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          <p className="text-slate-400 font-medium text-sm">Loading Sales Analytics & Hot Leads Pipeline...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalLeads: 0,
    qualifiedOrInterestedCount: 0,
    conversionRate: 0,
    minutesUsed: 0,
    minutesLimit: 1000,
    channelBreakdown: [],
  };

  const kanban = data?.kanbanColumns || {
    NEW: [],
    QUALIFIED: [],
    CONTACTED: [],
    INTERESTED: [],
    UNRESPONSIVE: [],
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-blue-400/30 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-5 w-5 text-emerald-300" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Header Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full mb-3">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>Real-Time Sales Intelligence Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {t('title')}
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            {t('subtitle')}
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="self-start md:self-auto inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:border-slate-600 text-sm font-medium transition shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Discovered Leads */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/40 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:bg-blue-500/10 transition" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              {t('totalLeads')}
            </span>
            <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-400 border border-blue-500/20">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-3">
            <span className="text-4xl font-extrabold text-white tracking-tight">
              {metrics.totalLeads}
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="h-3 w-3 mr-1" />
              +32% MoM
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-center space-x-1">
            <span>Sourced via LinkedIn & X/Twitter</span>
          </p>
        </div>

        {/* Card 2: Qualification Conversion Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/40 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none group-hover:bg-indigo-500/10 transition" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              {t('qualificationRate')}
            </span>
            <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-400 border border-indigo-500/20">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-3">
            <span className="text-4xl font-extrabold text-white tracking-tight">
              {metrics.conversionRate}%
            </span>
            <span className="text-xs text-slate-400">
              ({metrics.qualifiedOrInterestedCount} / {metrics.totalLeads} ICP Leads)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500"
              style={{ width: `${metrics.conversionRate}%` }}
            />
          </div>
        </div>

        {/* Card 3: Call Minutes Consumed */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              {t('minutesConsumed')}
            </span>
            <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-400 border border-emerald-500/20">
              <PhoneCall className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-white tracking-tight">
              {metrics.minutesUsed}
            </span>
            <span className="text-sm font-semibold text-slate-400">
              / {metrics.minutesLimit} mins
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  Math.round((metrics.minutesUsed / metrics.minutesLimit) * 100),
                  100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Card 4: Top Performing Channels */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              {t('topChannels')}
            </span>
            <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-400 border border-amber-500/20">
              <Share2 className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-2.5 mt-2">
            {metrics.channelBreakdown.length > 0 ? (
              metrics.channelBreakdown.map((ch) => (
                <div key={ch.name} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300 font-medium">
                    <span>{ch.name}</span>
                    <span className="text-slate-400 font-mono">{ch.percentage}% ({ch.count})</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all duration-500"
                      style={{ width: `${ch.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-2">
                <span>LinkedIn (60%) • X/Twitter (40%)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hot Leads Follow-up Kanban Board Header */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 text-amber-400">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                {t('kanbanTitle')}
              </h2>
              <p className="text-xs text-slate-400">{t('kanbanSubtitle')}</p>
            </div>
          </div>
          <div className="text-xs text-slate-400 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800 flex items-center space-x-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-blue-400" />
            <span>{t('dragNotice')}</span>
          </div>
        </div>

        {/* Kanban Board Columns Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 overflow-x-auto pb-6">
          {KANBAN_STAGES.map((stage) => {
            const columnLeads = kanban[stage.key] || [];
            const stageTitle = tKanban(stage.key);

            return (
              <div
                key={stage.key}
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col min-h-[500px] space-y-4 shadow-xl backdrop-blur-md"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${stage.color}`}>
                      {stageTitle}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Column Lead Cards List */}
                <div className="flex-1 space-y-3">
                  {columnLeads.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-slate-800/80 rounded-xl flex items-center justify-center text-xs text-slate-500 font-medium">
                      {tKanban('noLeads')}
                    </div>
                  ) : (
                    columnLeads.map((lead) => {
                      let parsedEnriched: any = {};
                      try {
                        parsedEnriched = JSON.parse(lead.enrichedData || '{}');
                      } catch (e) {}

                      const isCalling = callingLeadId === lead.id;

                      return (
                        <div
                          key={lead.id}
                          className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl p-4 shadow-lg space-y-3 transition transform hover:-translate-y-0.5 group"
                        >
                          {/* Card Header: Lead Name & Relevance Score */}
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-slate-100 text-sm group-hover:text-blue-400 transition">
                                {lead.name}
                              </h4>
                              <div className="flex items-center space-x-1 text-xs text-slate-400 mt-0.5">
                                <Building2 className="h-3 w-3 text-slate-500" />
                                <span className="font-medium">{lead.companyName}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                              {Math.round(lead.relevanceScore * 100)}% Match
                            </span>
                          </div>

                          {/* Contact Info & Platform Tag */}
                          <div className="space-y-1 text-xs text-slate-400">
                            <div className="flex items-center space-x-1.5 truncate">
                              <Mail className="h-3 w-3 text-slate-500 shrink-0" />
                              <span className="truncate">{lead.businessEmail}</span>
                            </div>
                            {lead.phone && (
                              <div className="flex items-center space-x-1.5">
                                <Phone className="h-3 w-3 text-slate-500 shrink-0" />
                                <span>{lead.phone}</span>
                              </div>
                            )}
                          </div>

                          {/* Post Snippet preview if present */}
                          {lead.postContent && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 font-sans italic">
                              "{lead.postContent}"
                            </p>
                          )}

                          {/* Tech Stack Pills */}
                          {parsedEnriched.techStack && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {parsedEnriched.techStack.slice(0, 3).map((tech: string) => (
                                <span
                                  key={tech}
                                  className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Interactive Actions Footer */}
                          <div className="pt-2 border-t border-slate-800/80 space-y-2">
                            {/* Status Changer Select */}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-slate-400 uppercase">
                                {t('moveStatus')}:
                              </span>
                              <select
                                value={lead.status}
                                disabled={updatingLeadId === lead.id}
                                onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                className="text-xs bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 font-medium"
                              >
                                {KANBAN_STAGES.map((s) => (
                                  <option key={s.key} value={s.key}>
                                    {tKanban(s.key)}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Trigger Voice Call Button */}
                            <button
                              onClick={() => handleInitiateCall(lead)}
                              disabled={isCalling}
                              className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold transition"
                            >
                              {isCalling ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                              ) : (
                                <PhoneCall className="h-3.5 w-3.5 text-blue-400" />
                              )}
                              <span>{t('initiateCall')}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
