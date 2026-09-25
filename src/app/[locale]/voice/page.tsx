'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PhoneCall, Layers, RefreshCw, AlertCircle } from 'lucide-react';
import VoiceAgentSimulator from '@/components/voice/VoiceAgentSimulator';
import CampaignLauncher from '@/components/campaigns/CampaignLauncher';

function VoiceContent() {
  const searchParams = useSearchParams();
  const leadId = searchParams ? searchParams.get('leadId') : null;
  const [initialLead, setInitialLead] = useState<any>(null);
  const [availableLeads, setAvailableLeads] = useState<any[]>([]);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leadError, setLeadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [leadsRes, meRes] = await Promise.all([
          fetch('/api/leads').then((r) => r.json()).catch(() => ({ success: false })),
          fetch('/api/auth/me').then((r) => r.json()).catch(() => ({ success: false })),
        ]);

        if (!mounted) return;

        if (meRes.success && meRes.data?.companyProfile) {
          setCompanyProfile(meRes.data.companyProfile);
        }

        if (leadsRes.success && Array.isArray(leadsRes.data)) {
          setAvailableLeads(leadsRes.data);
          if (leadId) {
            const found = leadsRes.data.find((l: any) => l.id === leadId);
            if (found) {
              setInitialLead(found);
              setLeadError(null);
            } else {
              setInitialLead(null);
              setLeadError(`Lead with ID "${leadId}" was not found or is not authorized for this account.`);
            }
          } else if (leadsRes.data.length > 0) {
            setInitialLead(leadsRes.data[0]);
            setLeadError(null);
          }
        } else if (!leadsRes.success) {
          setLeadError(leadsRes.error || 'Failed to load leads from database.');
        }
      } catch (e: any) {
        console.error('Failed to load voice page data:', e);
        if (mounted) setLeadError(e.message || 'Failed to load voice workspace.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [leadId]);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl max-w-4xl mx-auto shadow-sm">
        <RefreshCw className="h-7 w-7 animate-spin mx-auto text-indigo-600 mb-3" />
        <p className="text-sm font-semibold text-slate-800">Loading Voice AI Workspace...</p>
        <p className="text-xs text-slate-500 mt-1">Connecting to authenticated tenant leads & AI persona</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leadError && (
        <div className="max-w-6xl mx-auto bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{leadError}</span>
          </div>
        </div>
      )}
      <VoiceAgentSimulator
        initialLead={initialLead}
        availableLeads={availableLeads}
        companyProfile={companyProfile}
      />
    </div>
  );
}

export default function VoiceAndCampaignsPage() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'campaigns'>('simulator');

  return (
    <div className="space-y-6">
      {/* Navigation Tabs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#5C1D3A]/15 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0F0F12]">
            Voice AI & Campaign Operations
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
            Autonomous voice SDR calls, prospect qualification, and campaign scheduling.
          </p>
        </div>

        <div className="glass-card-solid p-1 rounded-2xl border border-[#5C1D3A]/20 inline-flex shadow-sm self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center space-x-1.5 ${
              activeTab === 'simulator'
                ? 'btn-primary-black text-[#F6E27A]'
                : 'text-slate-600 hover:text-[#0F0F12] hover:bg-white/60'
            }`}
          >
            <PhoneCall className="h-3.5 w-3.5 text-[#E5C158]" />
            <span>Voice Agent Simulator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center space-x-1.5 ${
              activeTab === 'campaigns'
                ? 'btn-primary-black text-[#F6E27A]'
                : 'text-slate-600 hover:text-[#0F0F12] hover:bg-white/60'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-[#E5C158]" />
            <span>Campaign Launcher</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'simulator' ? (
        <Suspense
          fallback={
            <div className="p-16 text-center text-slate-500 glass-card-solid rounded-3xl">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#0F0F12] mb-2" />
              <p className="text-xs font-semibold text-slate-700">Loading simulator...</p>
            </div>
          }
        >
          <VoiceContent />
        </Suspense>
      ) : (
        <CampaignLauncher />
      )}
    </div>
  );
}
