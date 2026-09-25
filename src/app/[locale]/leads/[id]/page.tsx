'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  ArrowLeft,
  PhoneCall,
  Mail,
  Building2,
  Globe,
  Sparkles,
  Target,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Phone,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export default function LeadDetailPage({
  params,
}: {
  params: { id: string; locale: string };
}) {
  const { id } = params;
  const locale = useLocale();
  const router = useRouter();

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'intelligence' | 'conversation' | 'journey' | 'contact'>('intelligence');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchLead() {
      try {
        const res = await fetch('/api/leads');
        const data = await res.json();
        if (mounted && data.success && Array.isArray(data.data)) {
          const found = data.data.find((l: any) => l.id === id);
          if (found) {
            setLead(found);
          } else {
            setError('Lead not found or unauthorized for this account.');
          }
        } else if (mounted) {
          setError('Failed to load lead details.');
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to fetch lead.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchLead();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setLead(data.data);
      }
    } catch (err) {
      console.error('Failed to update lead status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 glass-card-solid rounded-3xl max-w-4xl mx-auto shadow-sm">
        <RefreshCw className="h-7 w-7 animate-spin mx-auto text-[#0F0F12] mb-3" />
        <p className="text-sm font-bold text-[#0F0F12]">Loading Lead Profile...</p>
        <p className="text-xs text-slate-500 mt-1">Fetching intelligence score & conversation history</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-2xl mx-auto p-8 glass-card-solid rounded-3xl text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-[#F87171]/15 border border-[#F87171]/40 text-rose-700 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-extrabold text-[#0F0F12]">Lead Not Found</h2>
        <p className="text-xs text-slate-600">{error || 'This lead does not exist in your tenant workspace.'}</p>
        <Link
          href={`/${locale}/leads`}
          className="btn-primary-black inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Leads Workspace</span>
        </Link>
      </div>
    );
  }

  const score = Math.round((lead.relevanceScore || 0.85) * 100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          href={`/${locale}/leads`}
          className="btn-secondary-glass inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Leads</span>
        </Link>
      </div>

      {/* Header Profile Card */}
      <div className="p-6 rounded-3xl glass-card-solid shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0F0F12] text-[#F6E27A] border border-[#E5C158]/30 font-extrabold flex items-center justify-center text-xl shadow-sm">
            {lead.name ? lead.name.charAt(0).toUpperCase() : 'L'}
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-extrabold text-[#0F0F12] tracking-tight">{lead.name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  lead.status === 'QUALIFIED'
                    ? 'bg-purple-500/10 text-purple-800 border border-purple-400/30'
                    : lead.status === 'BOOKED' || lead.status === 'CALENDLY_SENT'
                    ? 'bg-[#34D399]/15 text-emerald-900 border border-[#34D399]/40'
                    : lead.status === 'INTERESTED'
                    ? 'bg-teal-500/10 text-teal-800 border border-teal-400/30'
                    : 'bg-blue-500/10 text-blue-800 border border-blue-400/30'
                }`}
              >
                {lead.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
              <span className="flex items-center space-x-1 font-bold text-[#0F0F12]">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{lead.companyName}</span>
              </span>
              <span>•</span>
              <span>{lead.industry || 'Enterprise'}</span>
              <span>•</span>
              <span className="font-mono text-[11px] text-slate-500">ID: {lead.id}</span>
            </div>
          </div>
        </div>

        {/* Action Stack */}
        <div className="flex items-center space-x-2.5">
          <select
            value={lead.status}
            disabled={updatingStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/80 border border-[#5C1D3A]/20 text-xs font-semibold text-[#0F0F12] focus:outline-none"
          >
            <option value="NEW">Status: NEW</option>
            <option value="CONTACTED">Status: CONTACTED</option>
            <option value="QUALIFIED">Status: QUALIFIED</option>
            <option value="INTERESTED">Status: INTERESTED</option>
            <option value="BOOKED">Status: BOOKED</option>
            <option value="UNRESPONSIVE">Status: UNRESPONSIVE</option>
          </select>

          <Link
            href={`/${locale}/voice?leadId=${lead.id}`}
            className="btn-primary-black inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold"
          >
            <PhoneCall className="w-3.5 h-3.5 text-[#F6E27A]" />
            <span>Launch Voice SDR</span>
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-2 border-b border-[#5C1D3A]/15 pb-2 text-xs font-semibold">
        {[
          { id: 'intelligence', label: 'AI Intelligence & Score', icon: Sparkles },
          { id: 'conversation', label: 'Voice Calls & Transcripts', icon: PhoneCall },
          { id: 'journey', label: 'Lead Journey', icon: Target },
          { id: 'contact', label: 'Contact Details & Post', icon: Mail },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition ${
                active
                  ? 'bg-[#E6F0FA] text-[#0F0F12] font-bold border border-[#5C1D3A]/20 shadow-xs'
                  : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#E5C158]' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: AI Intelligence */}
      {activeTab === 'intelligence' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl glass-card border border-[#5C1D3A]/20 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Relevance Match</div>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-extrabold text-[#0F0F12]">{score}%</span>
              <span className="text-xs text-emerald-700 font-bold">High Intent</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-[#5C1D3A]/10">
              Evaluated against your active company profile ICP and technology migration offerings.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-card-solid space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Urgency & Timeline</div>
            <div className="text-lg font-extrabold text-[#0F0F12]">Immediate / Active</div>
            <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-[#5C1D3A]/10">
              Post explicitly references migration or deployment requirement in current quarter.
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-card-solid space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Next Best Action</div>
            <div className="text-lg font-extrabold text-[#0F0F12] flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-[#E5C158]" />
              <span>Voice SDR Outreach</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-[#5C1D3A]/10">
              Automated multi-turn voice call recommended to verify budget and lock Calendly slot.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Conversation */}
      {activeTab === 'conversation' && (
        <div className="p-6 rounded-3xl glass-card-solid space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#0F0F12]">Voice Telephony Records</h3>
            <Link
              href={`/${locale}/voice?leadId=${lead.id}`}
              className="text-xs font-bold text-[#0F0F12] hover:text-[#5C1D3A] underline flex items-center space-x-1"
            >
              <span>Open Live Simulator</span>
              <PhoneCall className="w-3 h-3 text-[#E5C158]" />
            </Link>
          </div>
          <p className="text-xs text-slate-600">
            Click "Launch Voice SDR" to simulate or dial this prospect via Twilio telephony.
          </p>
        </div>
      )}

      {/* Tab 3: Lead Journey */}
      {activeTab === 'journey' && (
        <div className="p-6 rounded-3xl glass-card-solid space-y-4">
          <h3 className="text-sm font-extrabold text-[#0F0F12]">Lifecycle Milestones</h3>
          <div className="flex flex-col space-y-3 text-xs">
            <div className="flex items-center space-x-3 text-emerald-800 font-semibold p-2.5 bg-[#34D399]/15 rounded-xl border border-[#34D399]/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>1. Lead Discovered & Ingested into Tenant Workspace</span>
            </div>
            <div className="flex items-center space-x-3 text-emerald-800 font-semibold p-2.5 bg-[#34D399]/15 rounded-xl border border-[#34D399]/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>2. RFC Email Validation & Deduplication Verified</span>
            </div>
            <div className="flex items-center space-x-3 text-[#0F0F12] font-semibold p-2.5 bg-[#E6F0FA] rounded-xl border border-[#5C1D3A]/20">
              <Clock className="w-4 h-4 text-[#0F0F12]" />
              <span>3. Voice SDR Outreach ({lead.status})</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Contact */}
      {activeTab === 'contact' && (
        <div className="p-6 rounded-3xl glass-card-solid space-y-4 text-xs">
          <h3 className="text-sm font-extrabold text-[#0F0F12]">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-2xl bg-white/70 border border-[#5C1D3A]/15 space-y-1">
              <div className="text-slate-500 font-bold uppercase text-[10px]">Business Email</div>
              <div className="font-bold text-[#0F0F12]">{lead.businessEmail}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/70 border border-[#5C1D3A]/15 space-y-1">
              <div className="text-slate-500 font-bold uppercase text-[10px]">Phone Number</div>
              <div className="font-bold text-[#0F0F12]">{lead.phone || 'Pending Normalization'}</div>
            </div>
            <div className="col-span-2 p-3.5 rounded-2xl bg-white/70 border border-[#5C1D3A]/15 space-y-1">
              <div className="text-slate-500 font-bold uppercase text-[10px]">Original Post Content</div>
              <p className="text-slate-700 leading-relaxed">{lead.originalPostContent || 'Ingested via CSV Batch'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
