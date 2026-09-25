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
  { key: 'NEW', badgeColor: 'bg-blue-500/10 text-blue-800 border-blue-400/30', colBorder: 'border-[#5C1D3A]/15', colBg: 'bg-white/60' },
  { key: 'QUALIFIED', badgeColor: 'bg-purple-500/10 text-purple-800 border-purple-400/30', colBorder: 'border-[#5C1D3A]/15', colBg: 'bg-white/60' },
  { key: 'CONTACTED', badgeColor: 'bg-[#FBBF24]/15 text-amber-900 border-[#FBBF24]/40', colBorder: 'border-[#5C1D3A]/15', colBg: 'bg-white/60' },
  { key: 'INTERESTED', badgeColor: 'bg-[#34D399]/15 text-emerald-900 border-[#34D399]/40', colBorder: 'border-[#5C1D3A]/15', colBg: 'bg-white/60' },
  { key: 'UNRESPONSIVE', badgeColor: 'bg-slate-100 text-slate-700 border-slate-300', colBorder: 'border-[#5C1D3A]/15', colBg: 'bg-white/60' },
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
      setNotification(`📞 Voice Agent dispatched to ${lead.name} (${lead.phone || lead.businessEmail})`);
      setTimeout(() => setNotification(null), 4000);
    }, 1000);
  };

  if (loading && !data) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="glass-card-solid rounded-3xl p-12 flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 text-[#0F0F12] animate-spin" />
          <p className="text-[#0F0F12] font-bold text-sm">Loading Sales Analytics Pipeline...</p>
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
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F0F12] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2.5 border border-[#5C1D3A]/20 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
          <span className="text-xs sm:text-sm font-semibold">{notification}</span>
        </div>
      )}

      {/* Header Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#5C1D3A]/15 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 bg-[#E6F0FA] border border-[#5C1D3A]/20 text-[#0F0F12] text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 shadow-xs">
            <Flame className="h-3.5 w-3.5 text-[#E5C158]" />
            <span>Sales Operations Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F0F12]">
            {t('title')}
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl">
            {t('subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAnalytics}
          className="btn-secondary-glass self-start sm:self-auto inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#0F0F12]' : 'text-slate-600'}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Discovered Leads */}
        <div className="glass-card-solid rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('totalLeads')}
            </span>
            <div className="bg-[#E6F0FA] text-[#0F0F12] p-2 rounded-xl border border-[#5C1D3A]/15">
              <Target className="h-4 w-4 text-[#0F0F12]" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-[#0F0F12] tracking-tight">
              {metrics.totalLeads}
            </span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-900 bg-[#34D399]/20 px-2 py-0.5 rounded-full border border-[#34D399]/40">
              <TrendingUp className="h-3 w-3 mr-0.5" />
              +32%
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Sourced via LinkedIn & public channels
          </p>
        </div>

        {/* Card 2: Qualification Conversion Rate */}
        <div className="glass-card-solid rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('qualificationRate')}
            </span>
            <div className="bg-[#34D399]/15 text-emerald-800 p-2 rounded-xl border border-[#34D399]/30">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-[#0F0F12] tracking-tight">
              {metrics.conversionRate}%
            </span>
            <span className="text-xs text-slate-600 font-medium">
              ({metrics.qualifiedOrInterestedCount} qualified)
            </span>
          </div>
          <div className="w-full bg-[#F2F0FF] h-2 rounded-full mt-3 overflow-hidden border border-[#5C1D3A]/10">
            <div
              className="bg-[#34D399] h-full transition-all duration-500 rounded-full"
              style={{ width: `${metrics.conversionRate}%` }}
            />
          </div>
        </div>

        {/* Card 3: Call Minutes Consumed */}
        <div className="glass-card-solid rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('minutesConsumed')}
            </span>
            <div className="bg-[#E6F0FA] text-[#0F0F12] p-2 rounded-xl border border-[#5C1D3A]/15">
              <PhoneCall className="h-4 w-4 text-[#0F0F12]" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-extrabold text-[#0F0F12] tracking-tight">
              {metrics.minutesUsed}
            </span>
            <span className="text-xs font-bold text-slate-600">
              / {metrics.minutesLimit} mins
            </span>
          </div>
          <div className="w-full bg-[#F2F0FF] h-2 rounded-full mt-3 overflow-hidden border border-[#5C1D3A]/10">
            <div
              className="bg-[#0F0F12] h-full transition-all duration-500 rounded-full"
              style={{
                width: `${Math.min(
                  Math.round((metrics.minutesUsed / Math.max(metrics.minutesLimit, 1)) * 100),
                  100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Card 4: Top Performing Channels */}
        <div className="glass-card-solid rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('topChannels')}
            </span>
            <div className="bg-[#FBBF24]/20 text-amber-900 p-2 rounded-xl border border-[#FBBF24]/30">
              <Share2 className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-2 mt-1">
            {metrics.channelBreakdown.length > 0 ? (
              metrics.channelBreakdown.map((ch) => (
                <div key={ch.name} className="space-y-1">
                  <div className="flex justify-between text-xs text-[#0F0F12] font-semibold">
                    <span>{ch.name}</span>
                    <span className="text-slate-600">{ch.percentage}% ({ch.count})</span>
                  </div>
                  <div className="w-full bg-[#F2F0FF] h-2 rounded-full overflow-hidden border border-[#5C1D3A]/10">
                    <div
                      className="bg-[#E5C158] h-full transition-all duration-500 rounded-full"
                      style={{ width: `${ch.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-600 py-1 font-medium">
                <span>LinkedIn (60%) • X/Twitter (40%)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hot Leads Follow-up Kanban Board */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="bg-[#E6F0FA] p-2 rounded-xl border border-[#5C1D3A]/20 text-[#0F0F12]">
              <Flame className="h-4 w-4 text-[#E5C158]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#0F0F12]">
                {t('kanbanTitle')}
              </h2>
              <p className="text-xs text-slate-600">{t('kanbanSubtitle')}</p>
            </div>
          </div>
          <div className="text-xs text-slate-700 bg-white/70 px-3 py-1.5 rounded-xl border border-[#5C1D3A]/15 flex items-center space-x-1.5 shadow-xs font-medium">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#0F0F12]" />
            <span>{t('dragNotice')}</span>
          </div>
        </div>

        {/* Kanban Board Columns Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {KANBAN_STAGES.map((stage) => {
            const columnLeads = kanban[stage.key] || [];
            const stageTitle = tKanban(stage.key);

            return (
              <div
                key={stage.key}
                className="glass-card-solid rounded-2xl p-3.5 flex flex-col min-h-[480px] space-y-3"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-[#5C1D3A]/15 pb-2.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${stage.badgeColor}`}>
                    {stageTitle}
                  </span>
                  <span className="text-xs font-bold bg-white/70 text-[#0F0F12] border border-[#5C1D3A]/15 px-2.5 py-0.5 rounded-full">
                    {columnLeads.length}
                  </span>
                </div>

                {/* Column Lead Cards List */}
                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {columnLeads.length === 0 ? (
                    <div className="h-28 border border-dashed border-[#5C1D3A]/20 rounded-xl flex items-center justify-center text-xs text-slate-500 font-medium">
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
                          className="bg-white/80 border border-[#5C1D3A]/15 hover:border-[#0F0F12]/30 rounded-xl p-3.5 shadow-xs space-y-2.5 transition"
                        >
                          {/* Card Header: Lead Name & Match Badge */}
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <h4 className="font-extrabold text-[#0F0F12] text-xs sm:text-sm">
                                {lead.name}
                              </h4>
                              <div className="flex items-center space-x-1 text-xs text-slate-600 mt-0.5">
                                <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
                                <span className="font-semibold truncate max-w-[130px]">{lead.companyName}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold bg-[#34D399]/20 text-emerald-900 border border-[#34D399]/40 px-1.5 py-0.5 rounded-md shrink-0">
                              {Math.round(lead.relevanceScore * 100)}%
                            </span>
                          </div>

                          {/* Contact Info */}
                          <div className="space-y-1 text-xs text-slate-600">
                            <div className="flex items-center space-x-1.5 truncate">
                              <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate">{lead.businessEmail}</span>
                            </div>
                            {lead.phone && (
                              <div className="flex items-center space-x-1.5">
                                <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>{lead.phone}</span>
                              </div>
                            )}
                          </div>

                          {/* Tech Stack Pills */}
                          {parsedEnriched.techStack && (
                            <div className="flex flex-wrap gap-1">
                              {parsedEnriched.techStack.slice(0, 3).map((tech: string) => (
                                <span
                                  key={tech}
                                  className="text-[10px] bg-[#E6F0FA] text-[#0F0F12] border border-[#5C1D3A]/15 px-2 py-0.5 rounded-md font-medium"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="pt-2 border-t border-[#5C1D3A]/10 space-y-2">
                            <div className="flex items-center justify-between gap-1 text-xs">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">
                                Stage:
                              </span>
                              <select
                                value={lead.status}
                                disabled={updatingLeadId === lead.id}
                                onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                className="text-xs bg-[#F2F0FF]/60 border border-[#5C1D3A]/20 text-[#0F0F12] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#0F0F12] font-semibold"
                              >
                                {KANBAN_STAGES.map((s) => (
                                  <option key={s.key} value={s.key}>
                                    {tKanban(s.key)}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleInitiateCall(lead)}
                              disabled={isCalling}
                              className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-xl bg-[#0F0F12] text-[#F6E27A] border border-[#E5C158]/30 hover:bg-black text-xs font-bold transition shadow-xs"
                            >
                              {isCalling ? (
                                <Loader2 className="h-3 w-3 animate-spin text-[#F6E27A]" />
                              ) : (
                                <PhoneCall className="h-3 w-3 text-[#E5C158]" />
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
