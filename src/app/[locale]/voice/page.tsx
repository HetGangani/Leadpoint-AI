'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PhoneCall, Layers, Zap, ArrowLeft, Target, RefreshCw } from 'lucide-react';
import VoiceAgentSimulator from '@/components/voice/VoiceAgentSimulator';
import CampaignLauncher from '@/components/campaigns/CampaignLauncher';

function VoiceContent() {
  const searchParams = useSearchParams();
  const leadId = searchParams ? searchParams.get('leadId') : null;
  const [initialLead, setInitialLead] = useState<any>(null);
  const [availableLeads, setAvailableLeads] = useState<any[]>([]);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
            } else if (leadsRes.data.length > 0) {
              setInitialLead(leadsRes.data[0]);
            }
          } else if (leadsRes.data.length > 0) {
            setInitialLead(leadsRes.data[0]);
          }
        }
      } catch (e) {
        console.error('Failed to load voice page data:', e);
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
      <div className="p-16 text-center text-slate-400 bg-slate-900/60 border border-slate-800 rounded-3xl max-w-4xl mx-auto">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-3" />
        <p className="text-sm font-semibold text-white">Loading Voice AI Workspace...</p>
        <p className="text-xs text-slate-400 mt-1">Connecting to authenticated tenant leads & AI persona</p>
      </div>
    );
  }

  return (
    <VoiceAgentSimulator
      initialLead={initialLead}
      availableLeads={availableLeads}
      companyProfile={companyProfile}
    />
  );
}

export default function VoiceAndCampaignsPage() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'campaigns'>('simulator');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <a
            href="/en/leads"
            className="bg-slate-800 p-2 rounded-xl text-slate-300 hover:text-white transition border border-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <div className="bg-blue-600/20 p-2 rounded-xl border border-blue-500/30 text-blue-400">
            <Zap className="h-6 w-6" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            LeadPoint AI Voice Platform
          </span>
        </div>

        <nav className="flex items-center space-x-6 text-sm text-slate-300">
          <a href="/en/leads" className="hover:text-blue-400 transition flex items-center space-x-1">
            <Target className="h-4 w-4 text-slate-400" />
            <span>Lead Discovery</span>
          </a>
          <a href="/en/voice" className="text-blue-400 font-semibold flex items-center space-x-1">
            <PhoneCall className="h-4 w-4 text-blue-400" />
            <span>Voice AI & Campaigns</span>
          </a>
        </nav>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-center">
          <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 inline-flex space-x-2">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-6 py-2.5 rounded-xl font-semibold text-xs transition flex items-center space-x-2 ${
                activeTab === 'simulator'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PhoneCall className="h-4 w-4" />
              <span>Voice Agent Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-6 py-2.5 rounded-xl font-semibold text-xs transition flex items-center space-x-2 ${
                activeTab === 'campaigns'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Campaign Automation Launcher</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'simulator' ? (
          <Suspense
            fallback={
              <div className="p-16 text-center text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-2" />
                <p className="text-xs">Loading simulator...</p>
              </div>
            }
          >
            <VoiceContent />
          </Suspense>
        ) : (
          <CampaignLauncher />
        )}
      </div>
    </main>
  );
}
